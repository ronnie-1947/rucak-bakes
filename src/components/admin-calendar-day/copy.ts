import type { DayPlan } from "@/lib/calendar/form"
import { fill } from "@/lib/template"
import type { AdminCopy } from "./types"

/** Dict strings for the day editor, filled. */

/** "5 counter-items" / "1 counter-item" */
export function itemsText(count: number, dict: AdminCopy): string {
  return count === 1 ? dict.calendar.counts.itemsOne : fill(dict.calendar.counts.items, { count })
}

/** "86 pieces" / "1 piece" */
export function unitsText(count: number, dict: AdminCopy): string {
  return count === 1 ? dict.calendar.counts.unitsOne : fill(dict.calendar.counts.units, { count })
}

/** "5 counter-items · 86 pieces" — the day's counter as it stands, or "No counter-items". */
export function planSummary(plan: DayPlan, dict: AdminCopy): string {
  const included = Object.values(plan.items).filter((item) => item.included)
  if (included.length === 0) return dict.calendarDay.strip.none
  const units = included.reduce((sum, item) => sum + item.quantity, 0)
  return fill(dict.calendarDay.strip.summary, { items: itemsText(included.length, dict), units: unitsText(units, dict) })
}

/** "Country sourdough, Seeded rye, Butter croissant +3 more" */
export function namesPreview(names: string[], dict: AdminCopy, shown = 3): string {
  const head = names.slice(0, shown).join(", ")
  return names.length > shown ? fill(dict.calendar.moreNames, { names: head, count: names.length - shown }) : head
}
