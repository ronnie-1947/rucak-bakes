import { createHmac } from "node:crypto"
import { addDays, formatDayTimeIn, type IsoDate } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { botConfigured, botUsername, TelegramError } from "@/lib/telegram"

/**
 * Telegram as the settings screen sees it: whether a chat is connected and whether messages are reaching
 * it, the code that connects one, and the bookkeeping that tells the two apart. Server-only.
 *
 * Connecting never asks for a chat id. The owner sends the bot a short code (or taps the deep link,
 * which sends "/start CODE"); `findChatWithCode` reads the bot's recent messages for it, and that chat
 * is the one stored.
 */

/** No 0/O, 1/I/L — it may be read off one screen and typed on another. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

/**
 * Six characters, the same all day, derived from AUTH_SECRET — nothing to store, and nobody without the
 * secret can produce one. Yesterday's is accepted too, so a code read just before midnight still works.
 */
export function connectCode(date: IsoDate): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not set")
  const digest = createHmac("sha256", secret).update(`telegram-connect:${date}`).digest()
  return Array.from(digest.subarray(0, 6), (byte) => ALPHABET[byte % ALPHABET.length]).join("")
}

export function acceptedCodes(today: IsoDate): string[] {
  return [connectCode(today), connectCode(addDays(today, -1))]
}

/** Why messages stopped, in the owner's terms — from Telegram's description of the last refusal. */
export type TelegramFailure = "blocked" | "removed" | "other"

function failureOf(description: string | null): TelegramFailure {
  if (!description) return "other"
  if (/blocked/i.test(description)) return "blocked"
  if (/kicked|not a member|chat not found|deactivated|upgraded to a supergroup/i.test(description)) return "removed"
  return "other"
}

/** How to connect: the bot to search for, today's code, and a link that opens the bot with the code filled in. */
export type ConnectSteps = { bot: string | null; code: string; link: string | null }

export type TelegramState =
  /** No bot token — a developer has to add the bot first. */
  | { kind: "unavailable" }
  | { kind: "off"; steps: ConnectSteps | null }
  | { kind: "on"; connectedLabel: string; lastSentLabel: string | null }
  | { kind: "failed"; failedLabel: string; failure: TelegramFailure; steps: ConnectSteps | null }

type TelegramRow = {
  telegramChatId: string | null
  telegramConnectedAt: Date | null
  telegramLastSentAt: Date | null
  telegramFailedAt: Date | null
  telegramError: string | null
}

async function connectSteps(today: IsoDate): Promise<ConnectSteps> {
  const code = connectCode(today)
  const bot = await botUsername()
  return { bot, code, link: bot ? `https://t.me/${bot}?start=${code}` : null }
}

/**
 * Failing means the last message after connecting was refused and nothing has got through since. Steps
 * (with the code) are only worked out for owners — `withSteps` — since only they can connect.
 */
export async function telegramState(row: TelegramRow, timezone: string, today: IsoDate, withSteps: boolean): Promise<TelegramState> {
  if (!botConfigured()) return { kind: "unavailable" }
  const steps = withSteps ? await connectSteps(today) : null
  if (!row.telegramChatId || !row.telegramConnectedAt) return { kind: "off", steps }

  const failedAt = row.telegramFailedAt
  const failing = failedAt && failedAt > row.telegramConnectedAt && (!row.telegramLastSentAt || failedAt > row.telegramLastSentAt)
  if (failing) return { kind: "failed", failedLabel: formatDayTimeIn(failedAt, timezone), failure: failureOf(row.telegramError), steps }
  return {
    kind: "on",
    connectedLabel: formatDayTimeIn(row.telegramConnectedAt, timezone),
    lastSentLabel: row.telegramLastSentAt ? formatDayTimeIn(row.telegramLastSentAt, timezone) : null,
  }
}

/**
 * Notes how a message to the owner went, so the settings screen can say alerts are failing. Pass the
 * error a send threw, or null when it went through. Never throws — it runs beside order notifications.
 */
export async function recordDelivery(error: unknown): Promise<void> {
  const now = new Date()
  const data =
    error === null
      ? { telegramLastSentAt: now }
      : { telegramFailedAt: now, telegramError: (error instanceof TelegramError ? error.description : String(error)).slice(0, 300) }
  await prisma.settings.update({ where: { id: 1 }, data }).catch((recordError: unknown) => {
    console.error("Could not record the Telegram delivery:", recordError)
  })
}
