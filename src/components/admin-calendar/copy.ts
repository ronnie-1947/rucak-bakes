import type { CopyChange, CopySkip } from "@/lib/calendar/copy-plan"
import { type CutoffChoice, cutoffKey, cutoffLabel, cutoffOptions } from "@/lib/calendar/cutoffs"
import type { CounterItem, WeekDay, WeekOrder, WeekPlan } from "@/lib/calendar/week"
import { fill } from "@/lib/template"
import type { AdminCopy, CalendarCopy } from "./types"

/** Dict strings for the week planner, filled. */

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : fill(many, { count })
}

/** "5 counter-items" / "1 counter-item" */
export function itemsText(count: number, dict: CalendarCopy): string {
  return plural(count, dict.counts.itemsOne, dict.counts.items)
}

/** "6 open days · 23 orders · counter-items on 4 days" */
export function summaryText(week: WeekPlan, dict: CalendarCopy): string {
  const open = week.days.filter((day) => day.isOpen && (day.planned || !day.isPast))
  const orders = week.days.reduce((sum, day) => sum + day.liveOrders.length, 0)
  const counterDays = open.filter((day) => day.counter.length > 0).length
  return [
    plural(open.length, dict.openDaysOne, dict.openDays),
    plural(orders, dict.weekOrdersOne, dict.weekOrders),
    plural(counterDays, dict.counterDaysOne, dict.counterDays),
  ].join(" · ")
}

/** "Butter croissant ×24 · Cookie ×30 · Sourdough loaf ×8" */
export function counterLine(counter: CounterItem[], dict: CalendarCopy): string {
  return counter.map((item) => fill(dict.counterItem, { name: item.name, count: item.quantity })).join(" · ")
}

/** "5 counter-items · Butter croissant, Cookie +3" — the narrow cards from 1280px. */
export function counterShort(counter: CounterItem[], dict: CalendarCopy): string {
  const names = counter
    .slice(0, 2)
    .map((item) => item.name)
    .join(", ")
  return fill(dict.counterShort, {
    items: itemsText(counter.length, dict),
    names: counter.length > 2 ? fill(dict.moreShort, { names, count: counter.length - 2 }) : names,
  })
}

/** "Sourdough loaf ×2" — an order's biggest line, as a card row names it. */
export function mainItemText(order: WeekOrder, dict: CalendarCopy): string | null {
  if (!order.main) return null
  return order.main.quantity > 1 ? fill(dict.mainItem, { name: order.main.name, count: order.main.quantity }) : order.main.name
}

/** The past card's one line: "6 orders · 4 counter-items", or "Closed". */
export function pastLine(day: WeekDay, dict: CalendarCopy): string {
  if (!day.isOpen) return dict.pastClosed
  const orders = day.liveOrders.length === 0 ? dict.pastNoOrders : plural(day.liveOrders.length, dict.pastOrdersOne, dict.pastOrders)
  const counter = day.counter.length === 0 ? dict.pastNoCounter : plural(day.counter.length, dict.pastCounterOne, dict.pastCounter)
  return fill(dict.pastLine, { orders, counter })
}

/** The <select> options for a cutoff, with the ones already in use kept. */
export function cutoffSelectOptions(inUse: CutoffChoice[], dict: AdminCopy["cutoffs"], length: "long" | "short") {
  return cutoffOptions(inUse).map((choice) => ({ value: cutoffKey(choice), label: cutoffLabel(choice, dict, length) }))
}

/** "Replaces 3 counter-items → open, 4 counter-items", "No counter-items → open, orders only", "Closed → closed". */
export function changeText(change: CopyChange, dict: CalendarCopy): string {
  const c = dict.copy.change
  const before =
    change.before.items > 0 ? fill(c.replaces, { items: itemsText(change.before.items, dict) }) : change.before.open ? c.noCounter : c.closed
  const after = !change.after.open ? c.toClosed : change.after.items > 0 ? fill(c.open, { items: itemsText(change.after.items, dict) }) : c.ordersOnly
  return fill(c.row, { before, after })
}

/** "3 orders on this day" — a Skipped row. */
export function skipText(skip: CopySkip, dict: CalendarCopy): string {
  const s = dict.copy.skip
  if (skip.kind === "past") return s.past
  if (skip.kind === "unplanned") return s.unplanned
  return plural(skip.count, s.ordersOne, s.orders)
}
