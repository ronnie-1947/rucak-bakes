import type { CopyChange, CopySkip } from "@/lib/calendar/copy-plan"
import { type CutoffChoice, cutoffKey, cutoffLabel, cutoffOptions } from "@/lib/calendar/cutoffs"
import type { WeekDay, WeekPlan } from "@/lib/calendar/week"
import { fill } from "@/lib/template"
import type { AdminCopy, CalendarCopy } from "./types"

/** Dict strings for the week planner, filled. */

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : fill(many, { count })
}

/** "5 items" / "1 item" */
export function itemsText(count: number, dict: CalendarCopy): string {
  return plural(count, dict.counts.itemsOne, dict.counts.items)
}

/** "6 open days · 38 items scheduled · 41 verified orders" */
export function summaryText(week: WeekPlan, dict: CalendarCopy): string {
  const open = week.days.filter((day) => day.isOpen && (day.planned || !day.isPast))
  const items = open.reduce((sum, day) => sum + day.items.length, 0)
  const verified = week.days.reduce((sum, day) => sum + day.verified, 0)
  return [
    plural(open.length, dict.openDaysOne, dict.openDays),
    plural(items, dict.itemsScheduledOne, dict.itemsScheduled),
    plural(verified, dict.verifiedOrdersOne, dict.verifiedOrders),
  ].join(" · ")
}

/** "Country sourdough, Seeded rye, Butter croissant +3 more" */
export function namesPreview(names: string[], dict: CalendarCopy, shown = 3): string {
  const head = names.slice(0, shown).join(", ")
  return names.length > shown ? fill(dict.moreNames, { names: head, count: names.length - shown }) : head
}

/** The past card's one line. */
export function pastLine(day: WeekDay, dict: CalendarCopy): string {
  if (!day.planned) return dict.pastUnplanned
  if (!day.isOpen) return dict.pastClosed
  const count = day.liveOrders.length
  return count === 0 ? dict.pastNoOrders : plural(count, dict.pastOrdersOne, dict.pastOrders)
}

/** The <select> options for a cutoff, with the ones already in use kept. */
export function cutoffSelectOptions(inUse: CutoffChoice[], dict: AdminCopy["cutoffs"], length: "long" | "short") {
  return cutoffOptions(inUse).map((choice) => ({ value: cutoffKey(choice), label: cutoffLabel(choice, dict, length) }))
}

/** "Replaces 6 items with 7 items" — a Will change row of the copy dialog. */
export function changeText(change: CopyChange, dict: CalendarCopy): string {
  const c = dict.copy.change
  if (change.kind === "replace") return fill(c.replace, { from: itemsText(change.from, dict), to: itemsText(change.to, dict) })
  if (change.kind === "fill") return fill(c.fill, { to: itemsText(change.to, dict) })
  if (change.kind === "open") return fill(c.open, { to: itemsText(change.to, dict) })
  return c.close
}

/** "3 orders on this day" — a Skipped row. */
export function skipText(skip: CopySkip, dict: CalendarCopy): string {
  const s = dict.copy.skip
  if (skip.kind === "past") return s.past
  if (skip.kind === "unplanned") return s.unplanned
  return plural(skip.count, s.ordersOne, s.orders)
}
