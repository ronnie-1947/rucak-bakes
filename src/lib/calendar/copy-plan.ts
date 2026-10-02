import { addDays, formatDayNumber, type IsoDate } from "@/lib/dates"

/**
 * What "Copy last week" would do to each day of the target week — computed the same way for the dialog's
 * preview (week.ts) and for the write itself (writes.ts), so the dialog never promises something else.
 * Pure; server and client safe.
 */

/** One day as the copy sees it. A day with no MenuDay row is `planned: false`. */
export type CopyDayFacts = {
  date: IsoDate
  planned: boolean
  isOpen: boolean
  /** Orders still alive on the day (pending, verified, ready, collected). */
  liveOrders: number
  /** As a target: every item on the day. As a source: the ones that would copy — active and not archived. */
  items: number
}

export type CopyChange =
  | { kind: "replace"; from: number; to: number }
  | { kind: "fill"; to: number }
  | { kind: "open"; to: number }
  | { kind: "close" }

export type CopySkip = { kind: "past" } | { kind: "orders"; count: number } | { kind: "unplanned" }

export type CopyRow = { date: IsoDate; label: string } & ({ change: CopyChange; skip?: never } | { skip: CopySkip; change?: never })

/**
 * Pairs each target day with the same weekday a week earlier. Skipped: days already past, days with live
 * orders (their plan is what those orders were placed against), and days whose source was never planned.
 */
export function planWeekCopy(target: CopyDayFacts[], source: Map<IsoDate, CopyDayFacts>, today: IsoDate): CopyRow[] {
  return target.map((day): CopyRow => {
    const label = formatDayNumber(day.date)
    const from = source.get(addDays(day.date, -7))
    if (day.date < today) return { date: day.date, label, skip: { kind: "past" } }
    if (day.liveOrders > 0) return { date: day.date, label, skip: { kind: "orders", count: day.liveOrders } }
    if (!from?.planned) return { date: day.date, label, skip: { kind: "unplanned" } }
    if (!from.isOpen) return { date: day.date, label, change: { kind: "close" } }
    if (day.planned && day.isOpen && day.items > 0) return { date: day.date, label, change: { kind: "replace", from: day.items, to: from.items } }
    if (day.planned && !day.isOpen) return { date: day.date, label, change: { kind: "open", to: from.items } }
    return { date: day.date, label, change: { kind: "fill", to: from.items } }
  })
}
