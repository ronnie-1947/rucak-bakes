import { addDays, formatDayLabel, type IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import { formatPaise } from "@/lib/money"
import { formatForDisplay } from "@/lib/phone"
import { fill } from "@/lib/template"

/** Telegram refused (or never answered) a call. `description` is its own words — "Forbidden: bot was blocked by the user". */
export class TelegramError extends Error {
  constructor(
    readonly status: number,
    readonly description: string,
  ) {
    super(`Telegram ${status}: ${description}`)
  }
}

/** The bot token is set — without it there is nothing to connect. */
export function botConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN)
}

type BotReply<T> = { ok: boolean; result?: T; description?: string }

/** One Bot API call. A body makes it a POST; without one it's a GET, which `next.revalidate` can cache. */
async function callBot<T>(method: string, body?: object, revalidate?: number): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new TelegramError(0, "Telegram is not configured")
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    ...(revalidate ? { next: { revalidate } } : {}),
    // A hung Telegram API must not hold the customer's request open.
    signal: AbortSignal.timeout(8_000),
  }).catch((error: unknown) => {
    throw new TelegramError(0, error instanceof Error ? error.message : "Network error")
  })
  const reply = (await res.json().catch(() => null)) as BotReply<T> | null
  if (!res.ok || !reply?.ok) throw new TelegramError(res.status, reply?.description ?? `HTTP ${res.status}`)
  return reply.result as T
}

/**
 * Sends one message to the owner's Telegram chat; throws a TelegramError on any failure.
 *
 * The database write is the order — this is a notification sent AFTER the commit, never part of it.
 * Every caller wraps it so a failure sets `notificationFailed: true` on the order and nothing else.
 *
 * `chatId` is the chat the settings screen's connect flow stored; TELEGRAM_CHAT_ID is the fallback.
 */
export async function notifyOwner(text: string, chatId?: string | null) {
  const chat = chatId || process.env.TELEGRAM_CHAT_ID
  if (!chat) throw new TelegramError(0, "No Telegram chat is connected")
  await callBot("sendMessage", { chat_id: chat, text, parse_mode: "HTML", link_preview_options: { is_disabled: true } })
}

/** The bot's @username, for the connect steps — cached for a day. Null when Telegram can't be reached. */
export async function botUsername(): Promise<string | null> {
  try {
    const me = await callBot<{ username?: string }>("getMe", undefined, 86_400)
    return me.username ?? null
  } catch (error) {
    console.error("Telegram getMe failed:", error)
    return null
  }
}

type Update = { message?: { text?: string; chat: { id: number } } }

/**
 * The chat that sent the bot one of `codes` — "/start CODE" from the deep link, or the code typed — in the
 * last day's messages (Telegram keeps unread updates for 24 hours). Newest first. Throws if Telegram can't
 * be reached, or the bot has a webhook (getUpdates and webhooks are exclusive).
 */
export async function findChatWithCode(codes: string[]): Promise<string | null> {
  const updates = await callBot<Update[]>("getUpdates", { limit: 100, allowed_updates: ["message"] })
  for (const update of updates.toReversed()) {
    const text = update.message?.text?.toUpperCase()
    if (text && codes.some((code) => text.includes(code))) return String(update.message?.chat.id)
  }
  return null
}

/** Telegram's HTML mode rejects the whole message on a stray `<` — escape everything anyone typed. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export type OrderMessage = {
  code: string
  fulfilmentDate: IsoDate
  fulfilmentType: "PICKUP" | "DELIVERY"
  customerName: string
  /** E.164 */
  customerPhone: string
  /** The customer's earlier orders — "Ordered before (n)" shows only when there are some. */
  previousOrders: number
  autoVerified: boolean
  isSuspected: boolean
  items: { name: string; quantity: number; lineTotalPaise: number }[]
  totalPaise: number
  customerNote: string | null
  /** Pending orders for the day, this one included, against the day's maxOrders. */
  pendingCount: number
  maxOrders: number
  /** Today in the bakery's timezone, for "today" / "tomorrow". */
  today: IsoDate
  /** Absolute link to the order's admin page. */
  url: string
}

const RULE = "──────────"
/** Longer names still print in full — they just stop the price column lining up. */
const NAME_COLUMN_MAX = 24

/**
 * The new-order message, per dev-docs/implementation.md Step 2.5:
 *
 *   🥐 New order BK-4812
 *   Sat 3 Oct · Pickup
 *   Priya M · +91 98765 43210  ✅ Ordered before (4)
 *   ──────────
 *   2× Sourdough loaf     ₹480
 *   ──────────
 *   Total ₹800
 *   Note: "no walnuts"
 *   Pending 6/10 today
 *   → https://…/admin/orders/<id>
 */
export function formatOrderMessage(order: OrderMessage, copy: Dict["telegram"]): string {
  const say = (template: string, values: Record<string, string | number> = {}) =>
    fill(escapeHtml(template), Object.fromEntries(Object.entries(values).map(([key, value]) => [key, escapeHtml(String(value))])))

  const customer = [`${escapeHtml(order.customerName)} · ${formatForDisplay(order.customerPhone)}`]
  if (order.previousOrders > 0) customer.push(`✅ ${say(copy.orderedBefore, { count: order.previousOrders })}`)

  // Monospace inside <pre>, so the price column lines up like a receipt. Pad first, then escape.
  const nameWidth = Math.min(NAME_COLUMN_MAX, Math.max(...order.items.map((item) => item.name.length)))
  const qtyWidth = Math.max(...order.items.map((item) => String(item.quantity).length))
  const prices = order.items.map((item) => formatPaise(item.lineTotalPaise))
  const priceWidth = Math.max(...prices.map((price) => price.length))
  const lines = order.items.map((item, index) => {
    const qty = `${String(item.quantity).padStart(qtyWidth)}×`
    return escapeHtml(`${qty} ${item.name.padEnd(nameWidth)}  ${prices[index].padStart(priceWidth)}`)
  })

  const day =
    order.fulfilmentDate === order.today
      ? copy.today
      : order.fulfilmentDate === addDays(order.today, 1)
        ? copy.tomorrow
        : fill(copy.onDay, { day: formatDayLabel(order.fulfilmentDate) })

  return [
    `🥐 <b>${say(copy.newOrder, { code: order.code })}</b>`,
    `${formatDayLabel(order.fulfilmentDate)} · ${say(copy.fulfilment[order.fulfilmentType])}`,
    customer.join("  "),
    ...(order.isSuspected ? [`⚠️ ${say(copy.suspected)}`] : []),
    ...(order.autoVerified ? [`✅ ${say(copy.autoVerified)}`] : []),
    `<pre>${[RULE, ...lines, RULE].join("\n")}</pre>`,
    `<b>${say(copy.total, { amount: formatPaise(order.totalPaise) })}</b>`,
    ...(order.customerNote ? [say(copy.note, { note: order.customerNote })] : []),
    say(copy.pending, { pending: order.pendingCount, max: order.maxOrders, day }),
    `→ ${escapeHtml(order.url)}`,
  ].join("\n")
}
