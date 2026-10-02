import type { DayPlan } from "@/lib/calendar/form"
import { fill } from "@/lib/template"
import type { AdminCopy } from "./types"

/** Dict strings for the day editor, filled. */

/** "5 items" / "1 item" */
export function itemsText(count: number, dict: AdminCopy): string {
  return count === 1 ? dict.calendar.counts.itemsOne : fill(dict.calendar.counts.items, { count })
}

/** "74 units" / "1 unit" */
export function unitsText(count: number, dict: AdminCopy): string {
  return count === 1 ? dict.calendar.counts.unitsOne : fill(dict.calendar.counts.units, { count })
}

/** "6 items · 74 units available" — what the day offers as it stands. */
export function planSummary(plan: DayPlan, dict: AdminCopy): string {
  const included = Object.values(plan.items).filter((item) => item.included)
  const units = included.reduce((sum, item) => sum + item.quantity, 0)
  return fill(dict.calendarDay.strip.summary, { items: itemsText(included.length, dict), units: unitsText(units, dict) })
}

/** "Country sourdough, Seeded rye, Butter croissant +3 more" */
export function namesPreview(names: string[], dict: AdminCopy, shown = 3): string {
  const head = names.slice(0, shown).join(", ")
  return names.length > shown ? fill(dict.calendar.moreNames, { names: head, count: names.length - shown }) : head
}
