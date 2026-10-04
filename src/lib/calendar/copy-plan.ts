import { addDays, formatDayNumber, type IsoDate } from "@/lib/dates"

/**
 * What "Copy last week" would do to each day of the target week — computed the same way for the dialog's
 * preview (week.ts) and for the write itself (writes.ts), so the dialog never promises something else.
 * Pure; server and client safe.
 */

/** One day as the copy sees it. A day with no MenuDay row is `planned: false` (and open unless the opening hours close it). */
export type CopyDayFacts = {
  date: IsoDate
  planned: boolean
  isOpen: boolean
  /** Orders still alive on the day (pending, verified, ready, collected). */
  liveOrders: number
  /** Counter-items. As a target: every one on the day. As a source: the ones that would copy — active and not archived. */
  items: number
}

/** A day before and after the copy — "Replaces 3 counter-items → open, 4 counter-items", "Closed → closed". */
export type CopyChange = { before: { open: boolean; items: number }; after: { open: boolean; items: number } }

export type CopySkip = { kind: "past" } | { kind: "orders"; count: number } | { kind: "unplanned" }

export type CopyRow = { date: IsoDate; label: string } & ({ change: CopyChange; skip?: never } | { skip: CopySkip; change?: never })

/**
 * Pairs each target day with the same weekday a week earlier. Skipped: days already past, days with live
 * orders (their limits are what those orders were placed against), and days whose source was never planned.
 */
export function planWeekCopy(target: CopyDayFacts[], source: Map<IsoDate, CopyDayFacts>, today: IsoDate): CopyRow[] {
  return target.map((day): CopyRow => {
    const label = formatDayNumber(day.date)
    const from = source.get(addDays(day.date, -7))
    if (day.date < today) return { date: day.date, label, skip: { kind: "past" } }
    if (day.liveOrders > 0) return { date: day.date, label, skip: { kind: "orders", count: day.liveOrders } }
    if (!from?.planned) return { date: day.date, label, skip: { kind: "unplanned" } }
    const change: CopyChange = {
      before: { open: day.isOpen, items: day.items },
      after: { open: from.isOpen, items: from.isOpen ? from.items : 0 },
    }
    return { date: day.date, label, change }
  })
}
