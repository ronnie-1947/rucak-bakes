import { addDays, type IsoDate, isIsoDate, weekStart } from "@/lib/dates"

/**
 * The calendar's reach and its URLs. `/admin/calendar?week=2026-10-05` shows the week starting that Monday
 * (bare = this week); `/admin/calendar/2026-10-03` edits one day. Client-safe.
 */

/** How far the planner looks back (read-only history) and ahead. */
export const WEEKS_BACK = 4
export const WEEKS_AHEAD = 6

/** The first and last Monday the planner shows. */
export function weekBounds(today: IsoDate): { first: IsoDate; last: IsoDate } {
  const thisWeek = weekStart(today)
  return { first: addDays(thisWeek, -7 * WEEKS_BACK), last: addDays(thisWeek, 7 * WEEKS_AHEAD) }
}

/** ?week= → the Monday of that week, kept inside the bounds. Anything unreadable is this week. */
export function parseWeek(value: string | string[] | undefined, today: IsoDate): IsoDate {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw || !isIsoDate(raw)) return weekStart(today)
  const { first, last } = weekBounds(today)
  const monday = weekStart(raw)
  return monday < first ? first : monday > last ? last : monday
}

/** Whether a day can be opened in the editor — inside the weeks the planner shows. */
export function inPlanningRange(date: IsoDate, today: IsoDate): boolean {
  const { first, last } = weekBounds(today)
  return date >= first && date <= addDays(last, 6)
}

export function weekHref(monday: IsoDate, today: IsoDate): string {
  return monday === weekStart(today) ? "/admin/calendar" : `/admin/calendar?week=${monday}`
}

export function dayHref(date: IsoDate): string {
  return `/admin/calendar/${date}`
}

/** The orders queue for one day — where "View orders" goes. */
export function dayOrdersHref(date: IsoDate): string {
  return `/admin/orders?date=${date}`
}
