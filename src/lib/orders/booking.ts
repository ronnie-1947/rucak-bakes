import type { Settings } from "@/generated/prisma/client"
import { addDays, computeCutoffAt, dateRange, fromDbDate, type IsoDate, todayIn, toDbDate, weekday } from "@/lib/dates"
import { prisma, type Tx } from "@/lib/db"
import { LIVE_STATUSES, VERIFIED_STATUSES } from "@/lib/orders/status"
import { parseOpeningHours, weekdayKey } from "@/lib/settings/hours"
import type { BookingDay, BookingWindow } from "./deadline"

/**
 * The booking window read from the database (dev-docs/implementation.md §10R): every date from today to today +
 * orderAheadDays, planned or not. A date nobody planned takes the Settings defaults — the same defaults the MenuDay row
 * gets when the first order (placeOrder) or the first Calendar change creates it. The rules themselves are in deadline.ts.
 */

/** What a day nobody planned starts from. */
export type DayDefaults = Pick<
  Settings,
  "timezone" | "defaultCutoffTime" | "defaultCutoffDays" | "defaultMaxOrders" | "defaultOverbook" | "openingHours"
>

/** A date nobody planned is open unless the opening hours — once saved — mark its weekday closed. */
export function openByDefault(date: IsoDate, openingHours: unknown): boolean {
  const hours = parseOpeningHours(openingHours)
  return hours ? hours[weekdayKey(weekday(date))].open : true
}

/** The MenuDay row a date gets from the defaults. `cutoffAt` is computed for this date — never copied. */
export function newMenuDay(date: IsoDate, settings: DayDefaults) {
  return {
    date: toDbDate(date),
    isOpen: openByDefault(date, settings.openingHours),
    cutoffAt: computeCutoffAt(date, settings.defaultCutoffTime, settings.defaultCutoffDays, settings.timezone),
    cutoffTime: settings.defaultCutoffTime,
    cutoffDaysBefore: settings.defaultCutoffDays,
    maxOrders: settings.defaultMaxOrders,
    // The CHECK md_capacity_valid: the overbook limit is never below max.
    overbookLimit: Math.max(settings.defaultOverbook, settings.defaultMaxOrders),
  }
}

type WindowSettings = DayDefaults & Pick<Settings, "orderAheadDays" | "orderingPaused">

/** Every date of the window as it stands at `now`. Pass the transaction to read it under the same snapshot. */
export async function loadBookingWindow(settings: WindowSettings, now: Date, db: Tx = prisma): Promise<BookingWindow> {
  const today = todayIn(settings.timezone, now)
  const lastDay = addDays(today, settings.orderAheadDays)
  const [rows, counts] = await Promise.all([
    db.menuDay.findMany({
      where: { date: { gte: toDbDate(today), lte: toDbDate(lastDay) } },
      select: { id: true, date: true, isOpen: true, cutoffAt: true, cutoffTime: true, cutoffDaysBefore: true, maxOrders: true, overbookLimit: true },
    }),
    db.order.groupBy({
      by: ["fulfilmentDate", "status"],
      where: { fulfilmentDate: { gte: toDbDate(today), lte: toDbDate(lastDay) }, status: { in: [...LIVE_STATUSES] } },
      _count: true,
    }),
  ])

  const byDate = new Map(rows.map((row) => [fromDbDate(row.date), row]))
  const days = dateRange(today, lastDay).map((date): BookingDay => {
    const onDay = counts.filter((row) => fromDbDate(row.fulfilmentDate) === date)
    const taken = onDay.reduce((sum, row) => sum + row._count, 0)
    const verified = onDay.filter((row) => VERIFIED_STATUSES.includes(row.status)).reduce((sum, row) => sum + row._count, 0)
    const row = byDate.get(date) ?? null
    const day = row ?? newMenuDay(date, settings)
    return {
      date,
      planned: row !== null,
      isOpen: day.isOpen,
      cutoffAt: day.cutoffAt.getTime(),
      cutoffTime: day.cutoffTime,
      cutoffDaysBefore: day.cutoffDaysBefore,
      maxOrders: day.maxOrders,
      overbookLimit: day.overbookLimit,
      taken,
      verified,
    }
  })

  return { today, lastDay, now: now.getTime(), timeZone: settings.timezone, paused: settings.orderingPaused, days }
}
