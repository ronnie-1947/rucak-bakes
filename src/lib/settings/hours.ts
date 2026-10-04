import { z } from "zod"

/**
 * The shop's opening hours — `Settings.openingHours`, a JSON object keyed by weekday. These are the hours
 * the shop is open for pickup; when ordering closes is a separate setting. Client-safe.
 */

/** Monday first, the way the owner reads a week. */
export const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

export type WeekdayKey = (typeof WEEK)[number]

export type DayHours = { open: boolean; from: string; to: string }

export type OpeningHours = Record<WeekdayKey, DayHours>

/** What the form starts from before any hours are saved. Customers see nothing until they are. */
export const DEFAULT_HOURS: OpeningHours = Object.fromEntries(WEEK.map((day) => [day, { open: true, from: "08:00", to: "20:00" }])) as OpeningHours

/** Every half hour from 05:00 to 23:30 — the times the pickers offer. */
export const HOUR_TIMES: readonly string[] = Array.from({ length: 38 }, (_, index) => {
  const minutes = 5 * 60 + index * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${minutes % 60 ? "30" : "00"}`
})

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const dayHours = z.object({ open: z.boolean(), from: time, to: time })
export const openingHoursSchema = z.object(Object.fromEntries(WEEK.map((day) => [day, dayHours])) as Record<WeekdayKey, typeof dayHours>)

/** The stored hours, or null while they've never been saved (the column defaults to `{}`). */
export function parseOpeningHours(json: unknown): OpeningHours | null {
  const parsed = openingHoursSchema.safeParse(json)
  return parsed.success ? parsed.data : null
}

/** JS weekday (0 = Sunday) → our key. */
export function weekdayKey(day: number): WeekdayKey {
  return WEEK[(day + 6) % 7]
}

/** A stretch of consecutive weekdays (Monday first) with the same hours — "Tue–Sun, 7am–4pm". */
export type HoursRun = { first: WeekdayKey; last: WeekdayKey; hours: DayHours }

const sameHours = (a: DayHours, b: DayHours) => a.open === b.open && (!a.open || (a.from === b.from && a.to === b.to))

/** The week folded into runs of identical hours, for a one-glance summary. */
export function hoursRuns(hours: OpeningHours): HoursRun[] {
  const runs: HoursRun[] = []
  for (const day of WEEK) {
    const run = runs.at(-1)
    if (run && sameHours(run.hours, hours[day])) run.last = day
    else runs.push({ first: day, last: day, hours: hours[day] })
  }
  return runs
}

/** Pickup times a day's hours offer: every half hour from opening to the last one before closing — 07:00 … 15:30 for 7–4. */
export function pickupSlots(day: DayHours): string[] {
  if (!day.open) return []
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
  const slots: string[] = []
  for (let at = Math.ceil(minutes(day.from) / 30) * 30; at < minutes(day.to); at += 30) {
    slots.push(`${String(Math.floor(at / 60)).padStart(2, "0")}:${at % 60 ? "30" : "00"}`)
  }
  return slots
}

/** An open day must close after it opens. */
export function hoursProblem(day: DayHours): boolean {
  return day.open && day.to <= day.from
}
