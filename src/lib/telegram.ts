import { addDays, formatDayLabel, type IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import { formatPaise } from "@/lib/money"
import { formatForDisplay } from "@/lib/phone"
import { fill } from "@/lib/template"

/**
 * Sends one message to the owner's Telegram chat; throws on any failure.
 *
 * The database write is the order — this is a notification sent AFTER the commit, never part of it.
 * Every caller wraps it so a failure sets `notificationFailed: true` on the order and nothing else.
 *
 * `chatId` is the chat the settings screen's connect flow stored; TELEGRAM_CHAT_ID is the fallback.
 */
export async function notifyOwner(text: string, chatId?: string | null) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = chatId || process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) throw new Error("Telegram is not configured")

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", link_preview_options: { is_disabled: true } }),
    // A hung Telegram API must not hold the customer's request open.
    signal: AbortSignal.timeout(8_000),
  })
  if (!res.ok) throw new Error(`Telegram ${res.status}`)
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
