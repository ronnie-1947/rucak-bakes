import { z } from "zod"
import { MAX_LINE_QTY } from "@/lib/cart/cart"
import { type IsoDate, isIsoDate } from "@/lib/dates"
import { MAX_PRICE_PAISE } from "@/lib/money"
import { ADDRESS_MAX, NAME_MAX, NOTE_MAX } from "@/lib/orders/checkout"
import { type BookingDay, type BookingWindow, lineTooSoon, pastCutoff } from "@/lib/orders/deadline"
import { normalise } from "@/lib/phone"

/**
 * A staff order (dev-docs/implementation.md 7R.5): what /admin/orders/new sends (`createStaffOrder`, actions/orders.ts),
 * every answer it can get back, and the rules the form shows before it sends — the warnings and what's still missing.
 * Client-safe. The server re-checks everything; placeOrder's staff rules are the truth.
 */

/** The team's note — the same limit as the order page's own field. */
export const INTERNAL_NOTE_MAX = 1000

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/

export const staffOrderSchema = z.object({
  /** One per form, kept across retries and the full-day confirm. */
  idempotencyKey: z.uuid(),
  fulfilmentDate: z.string().refine(isIsoDate),
  fulfilmentType: z.enum(["PICKUP", "DELIVERY"]),
  name: z.string().trim().min(1).max(NAME_MAX),
  /** As typed; normalised to E.164 on the server. */
  phone: z.string().trim().min(1).max(20),
  address: z.string().trim().max(ADDRESS_MAX).nullable(),
  /** "HH:MM", or null for any time. */
  pickupTime: z.string().regex(HH_MM).nullable(),
  note: z.string().trim().max(NOTE_MAX).nullable(),
  internalNote: z.string().trim().max(INTERNAL_NOTE_MAX).nullable(),
  deliveryFeePaise: z.number().int().min(0).max(MAX_PRICE_PAISE),
  /** Staff confirmed "Add anyway" on a full day. */
  allowFull: z.boolean(),
  /** One line per item — the form never sends two; the server refuses them. `unitPricePaise` null = the menu price. */
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1).max(40),
        quantity: z.number().int().min(1).max(MAX_LINE_QTY),
        unitPricePaise: z.number().int().min(0).max(MAX_PRICE_PAISE).nullable(),
      }),
    )
    .min(1)
    .max(40)
    .refine((items) => new Set(items.map((item) => item.menuItemId)).size === items.length),
})

export type StaffOrderInput = z.input<typeof staffOrderSchema>

/** The parts of the form a refusal can point at. */
export type StaffOrderField = "phone" | "name" | "items" | "date" | "address"

export type StaffOrderRefusal =
  | { reason: "DAY_CLOSED" | "PAST_DATE"; date: IsoDate }
  | { reason: "ITEM_UNAVAILABLE"; menuItemId: string; name: string | null }
  /** Someone booked the last place meanwhile, or the form didn't know — the counts the confirm names. */
  | { reason: "DAY_FULL"; date: IsoDate; liveCount: number; overbookLimit: number; verifiedCount: number; maxOrders: number }
  | { reason: "INVALID"; field: StaffOrderField | null }

export type StaffOrderResult = { ok: true; id: string; code: string } | ({ ok: false } & StaffOrderRefusal)

/** Orders a day can still take from staff. A staff order is verified at once, so both limits count. Zero or less = full. */
export function staffRoom(day: Pick<BookingDay, "maxOrders" | "overbookLimit" | "taken" | "verified">): number {
  return Math.min(day.maxOrders - day.verified, day.overbookLimit - day.taken)
}

/** A line as the warnings see it. Prices in paise; `menuPricePaise` is what the menu charges. */
export type WarningLine = { name: string; noticeDays: number; quantity: number; unitPricePaise: number; menuPricePaise: number }

/** What staff should know before they add the order — none of it stops them. */
export type StaffOrderWarning =
  /** Customers can't book this day any more. */
  | { kind: "pastCutoff"; date: IsoDate; cutoffAt: number }
  /** This line's notice has run out for the day — its own deadline, earlier than the day's cutoff, has passed. */
  | { kind: "tooSoon"; name: string; noticeDays: number }
  /** `differencePaise` is the custom total less the menu total: below the menu when negative. */
  | { kind: "prices"; count: number; differencePaise: number }

type WarningDay = Pick<BookingDay, "date" | "isOpen" | "cutoffAt" | "cutoffTime" | "cutoffDaysBefore">

/** The line's notice reaches past the day's own cutoff and that earlier deadline has gone. */
export function noticeRunOut(day: WarningDay, noticeDays: number, window: Pick<BookingWindow, "now" | "timeZone">): boolean {
  return noticeDays > day.cutoffDaysBefore && lineTooSoon(day, noticeDays, window)
}

/**
 * The form's and the summary's warnings, in the order they read: the day's cutoff, each line too soon (the deadline rule,
 * deadline.ts), then custom prices. A closed day has none — it can't be booked at all.
 */
export function staffOrderWarnings(
  lines: WarningLine[],
  day: WarningDay | null,
  window: Pick<BookingWindow, "now" | "timeZone">,
): StaffOrderWarning[] {
  const warnings: StaffOrderWarning[] = []
  if (day?.isOpen) {
    if (pastCutoff(day, window.now)) warnings.push({ kind: "pastCutoff", date: day.date, cutoffAt: day.cutoffAt })
    for (const line of lines) {
      if (noticeRunOut(day, line.noticeDays, window)) warnings.push({ kind: "tooSoon", name: line.name, noticeDays: line.noticeDays })
    }
  }
  const custom = lines.filter((line) => line.unitPricePaise !== line.menuPricePaise)
  if (custom.length > 0) {
    const differencePaise = custom.reduce((sum, line) => sum + (line.unitPricePaise - line.menuPricePaise) * line.quantity, 0)
    warnings.push({ kind: "prices", count: custom.length, differencePaise })
  }
  return warnings
}

/** What the form still needs before Add order, first gap first — the button names it. Null when it can go. */
export type MissingStep = "phone" | "name" | "items" | "day" | "address"

export function missingStep(values: {
  phone: string
  name: string
  lineCount: number
  day: Pick<BookingDay, "isOpen"> | null
  delivery: boolean
  address: string
}): MissingStep | null {
  if (!normalise(values.phone)) return "phone"
  if (!values.name.trim()) return "name"
  if (values.lineCount === 0) return "items"
  if (!values.day?.isOpen) return "day"
  if (values.delivery && !values.address.trim()) return "address"
  return null
}

/**
 * A phone as typed or pasted into the field behind its fixed "+91": the ten digits, spaced "98765 43210". A pasted
 * "+91 98765 43210" or "098765 43210" loses its prefix first.
 */
export function typedPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "")
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2)
  else if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1)
  digits = digits.slice(0, 10)
  return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits
}
