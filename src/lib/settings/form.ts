import { MAX_ORDERS, OVERBOOK_MAX } from "@/lib/calendar/form"
import { hoursProblem, type OpeningHours, WEEK } from "./hours"

/**
 * The three settings sections that save as a form — Bakery details, Ordering rules, Appearance — as the
 * browser holds them, and the rules both the browser (save bar, inline errors) and the save actions (which
 * re-check everything) apply. Pause ordering, Auto-verify, Telegram and Staff save on their own. Client-safe.
 */

export const SETTINGS_LIMITS = { bakeryName: 60, tagline: 60, pickupAddress: 200, announcement: 120, pauseReason: 80, staffName: 60 }
export { MAX_ORDERS, OVERBOOK_MAX }
export const ORDER_AHEAD = { min: 1, max: 30 }
/** Kilometres. Shown to customers — addresses aren't checked against it. */
export const DELIVERY_RADIUS = { min: 1, max: 15, start: 3 }
/** Whole rupees, in steps of 10. Stored as paise. */
export const DELIVERY_FEE = { min: 0, max: 500, step: 10 }
/** "the same day", "the day before", "2 days before". A saved default outside these stays as an extra choice. */
export const CUTOFF_DAYS: readonly number[] = [0, 1, 2]

/** Field → the key of its message in `dict.admin.settings.errors`. Only fields with a problem appear. */
export type Problems<Field extends string> = Partial<Record<Field, string>>

/** How many settings differ, comparing each top-level value. */
function changedKeys<T extends object>(current: T, saved: T, skip: (keyof T)[] = []): number {
  const keys = Object.keys(current) as (keyof T)[]
  return keys.filter((key) => !skip.includes(key) && JSON.stringify(current[key]) !== JSON.stringify(saved[key])).length
}

// ── Bakery details ──────────────────────────────────────────────────────────

export type BakeryValues = {
  bakeryName: string
  tagline: string
  /** As typed after the fixed +91 — "98450 55012". Empty hides it. */
  phone: string
  pickupAddress: string
  hours: OpeningHours
}

export type BakeryField = "bakeryName" | "tagline" | "phone" | "pickupAddress" | "hours"

/** The ten national digits, forgiving a leading 0 or 91; anything else comes back as typed (and fails). */
export function phoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1)
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2)
  return digits
}

/** "+919845055012" → "98450 55012". Numbers from outside India show whole. */
export function phoneField(e164: string | null): string {
  if (!e164) return ""
  if (!e164.startsWith("+91") || e164.length !== 13) return e164
  return `${e164.slice(3, 8)} ${e164.slice(8)}`
}

export function bakeryProblems(values: BakeryValues): Problems<BakeryField> {
  const problems: Problems<BakeryField> = {}
  if (!values.bakeryName.trim()) problems.bakeryName = "nameRequired"
  else if (values.bakeryName.trim().length > SETTINGS_LIMITS.bakeryName) problems.bakeryName = "nameTooLong"
  if (values.tagline.trim().length > SETTINGS_LIMITS.tagline) problems.tagline = "taglineTooLong"
  if (values.phone.trim() && phoneDigits(values.phone).length !== 10) problems.phone = "phoneInvalid"
  if (values.pickupAddress.trim().length > SETTINGS_LIMITS.pickupAddress) problems.pickupAddress = "addressTooLong"
  if (WEEK.some((day) => hoursProblem(values.hours[day]))) problems.hours = "hoursOrder"
  return problems
}

/** Each day of the week counts on its own — "Copy to all days" can be six changes. */
export function bakeryChanges(current: BakeryValues, saved: BakeryValues): number {
  const days = WEEK.filter((day) => JSON.stringify(current.hours[day]) !== JSON.stringify(saved.hours[day])).length
  return changedKeys(current, saved, ["hours"]) + days
}

export function tidyBakery(values: BakeryValues): BakeryValues {
  return {
    ...values,
    bakeryName: values.bakeryName.trim(),
    tagline: values.tagline.trim(),
    phone: values.phone.trim(),
    pickupAddress: values.pickupAddress.trim(),
  }
}

// ── Ordering rules ──────────────────────────────────────────────────────────

/** The defaults a day starts from when it's first planned, and the rules that apply to every day. */
export type OrderingValues = {
  maxOrders: number
  overbookLimit: number
  cutoffTime: string
  cutoffDays: number
  orderAheadDays: number
  pickup: boolean
  delivery: boolean
  radiusKm: number
  feeRupees: number
}

export type OrderingField = "overbookLimit" | "fulfilment"

export function orderingProblems(values: OrderingValues): Problems<OrderingField> {
  const problems: Problems<OrderingField> = {}
  // The calendar's CHECK (overbookLimit ≥ maxOrders) — the stepper can't go lower, the server checks anyway.
  if (values.overbookLimit < values.maxOrders) problems.overbookLimit = "overbookBelowMax"
  if (!values.pickup && !values.delivery) problems.fulfilment = "noFulfilment"
  return problems
}

/** Radius and fee only count while delivery is on — they're kept, not saved, while it's off. */
export function orderingChanges(current: OrderingValues, saved: OrderingValues): number {
  return changedKeys(current, saved, current.delivery ? [] : ["radiusKm", "feeRupees"])
}

// ── Appearance ──────────────────────────────────────────────────────────────

/** The landing photo isn't here: it saves on its own, the moment it's uploaded (saveHeroImage). */
export type AppearanceValues = {
  announcementOn: boolean
  /** Kept while the banner is off, so turning it back on brings the text back. */
  announcement: string
}

export type AppearanceField = "announcement"

export function appearanceProblems(values: AppearanceValues): Problems<AppearanceField> {
  const problems: Problems<AppearanceField> = {}
  if (values.announcementOn && !values.announcement.trim()) problems.announcement = "announcementRequired"
  else if (values.announcement.trim().length > SETTINGS_LIMITS.announcement) problems.announcement = "announcementTooLong"
  return problems
}

/** The banner's text only counts while it's showing. */
export function appearanceChanges(current: AppearanceValues, saved: AppearanceValues): number {
  return changedKeys(current, saved, current.announcementOn ? [] : ["announcement"])
}

export function tidyAppearance(values: AppearanceValues): AppearanceValues {
  return { ...values, announcement: values.announcement.trim() }
}
