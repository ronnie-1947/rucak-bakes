import { formatClock } from "@/lib/calendar/cutoffs"
import { addDays, formatShortDate, formatWeekday, type IsoDate, weekday } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import type { OpeningHours } from "@/lib/settings/hours"
import { weekdayKey } from "@/lib/settings/hours"
import type { CartDay } from "@/lib/storefront/cart"
import type { DayStatus } from "@/lib/storefront/types"
import { relativeDay } from "@/lib/storefront/words"
import { fill } from "@/lib/template"

/** The strings the cart page sends to the browser, and the sentences built from them. Client-safe. */

export type CartPageCopy = {
  cart: Dict["store"]["cart"]
  days: Dict["store"]["days"]
  shell: Dict["store"]["shell"]
  item: Pick<Dict["store"]["item"], "decrease" | "increase">
}

export type Fulfilment = "PICKUP" | "DELIVERY"

export function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "1 item" / "3 items". */
export function itemsText(count: number, copy: CartPageCopy): string {
  return count === 1 ? copy.shell.itemsOne : fill(copy.shell.items, { count })
}

/** "today", "tomorrow", else the weekday — inside a sentence. */
export function dayName(date: IsoDate, today: IsoDate, copy: CartPageCopy): string {
  return relativeDay(date, today, copy.days)
}

/** "Tomorrow, 5 Oct", "Saturday, 10 Oct" — a day as a heading. */
export function dayTitle(date: IsoDate, today: IsoDate, copy: CartPageCopy): string {
  const c = copy.cart
  const label = date === today ? c.labels.today : date === addDays(today, 1) ? c.labels.tomorrow : formatWeekday(date)
  return fill(c.dayTitle, { label, date: formatShortDate(date) })
}

/** "Order by 6pm today". */
export function orderBy(day: CartDay, today: IsoDate, copy: CartPageCopy): string | null {
  if (!day.cutoff) return null
  return fill(copy.cart.orderBy, { time: formatClock(day.cutoff.time), when: dayName(day.cutoff.date, today, copy) })
}

/**
 * Why a day can't take this order, as a heading — "Saturday is now fully booked", "Orders for today closed at
 * 6pm yesterday" — or null when it can. `day` is null when the day has no menu at all.
 */
export function dayProblem(status: DayStatus, date: IsoDate, day: CartDay | null, today: IsoDate, copy: CartPageCopy): string | null {
  const p = copy.cart.problems
  const name = dayName(date, today, copy)
  switch (status) {
    case "open":
      return null
    case "paused":
      return p.paused
    case "full":
      return fill(p.full, { day: capitalise(name) })
    case "closed":
      return fill(p.closed, { day: name })
    case "unplanned":
      return fill(p.unplanned, { day: name })
    case "cutoff":
      return day?.cutoff
        ? fill(p.cutoff, { day: name, time: formatClock(day.cutoff.time), when: dayName(day.cutoff.date, today, copy) })
        : fill(p.closed, { day: name })
  }
}

/** The day card's last line: "Order by 6pm today · 9 of 15 orders left", or why it can't take the order. */
export function dayMeta(status: DayStatus, date: IsoDate, day: CartDay | null, today: IsoDate, copy: CartPageCopy): string {
  const problem = dayProblem(status, date, day, today, copy)
  if (problem || !day) return problem ?? ""
  return [orderBy(day, today, copy), fill(copy.cart.ordersLeft, { left: day.left, capacity: day.capacity })].filter(Boolean).join(" · ")
}

/** "7am–4pm" on that day's weekday, or null when the hours aren't set or the shop is shut that day. */
export function pickupHours(hours: OpeningHours | null, date: IsoDate, copy: CartPageCopy): string | null {
  const day = hours?.[weekdayKey(weekday(date))]
  if (!day?.open) return null
  return fill(copy.cart.details.hours, { from: formatClock(day.from), to: formatClock(day.to) })
}
