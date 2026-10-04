import { formatClock } from "@/lib/calendar/cutoffs"
import type { CartDayStatus, CartDayView } from "@/lib/cart/check"
import { addDays, formatShortDate, formatTimeIn, formatWeekday, type IsoDate, isoDateInZone, weekday } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import { type BookingWindow, FEW_ORDERS_LEFT, ordersLeft } from "@/lib/orders/deadline"
import type { OpeningHours } from "@/lib/settings/hours"
import { weekdayKey } from "@/lib/settings/hours"
import { relativeDay } from "@/lib/storefront/words"
import { fill } from "@/lib/template"

/** The strings the cart page sends to the browser, and the sentences built from them. Client-safe. */

export type CartPageCopy = {
  cart: Dict["store"]["cart"]
  days: Dict["store"]["days"]
  notice: Dict["store"]["notice"]
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

/** "Order by 6pm today", "Order by Thursday 6pm" — a deadline (epoch ms), bakery-local. */
export function orderBy(deadline: number, window: BookingWindow, copy: CartPageCopy): string {
  const instant = new Date(deadline)
  const time = formatClock(formatTimeIn(instant, window.timeZone))
  const date = isoDateInZone(instant, window.timeZone)
  return date === window.today ? fill(copy.cart.orderByToday, { time }) : fill(copy.cart.orderBy, { weekday: formatWeekday(date), time })
}

/**
 * Why the cart's day can't take the order, as a heading — "Saturday is now fully booked", "Orders for today closed at 6pm
 * yesterday" — or null when it can.
 */
export function dayProblem(status: CartDayStatus, date: IsoDate, view: CartDayView, window: BookingWindow, copy: CartPageCopy): string | null {
  const p = copy.cart.problems
  const name = dayName(date, window.today, copy)
  switch (status) {
    case "open":
      return null
    case "paused":
      return p.paused
    case "full":
      return fill(p.full, { day: capitalise(name) })
    case "closed":
      return fill(p.closed, { day: name })
    case "cutoff": {
      if (!view.day) return fill(p.closed, { day: name })
      const cutoff = new Date(view.day.cutoffAt)
      return fill(p.cutoff, {
        day: name,
        time: formatClock(formatTimeIn(cutoff, window.timeZone)),
        when: dayName(isoDateInZone(cutoff, window.timeZone), window.today, copy),
      })
    }
  }
}

/** "3 orders left that day" — only when the day is nearly full. */
export function fewLeft(left: number, copy: CartPageCopy): string | null {
  if (left > FEW_ORDERS_LEFT) return null
  return left === 1 ? copy.cart.ordersLeftOne : fill(copy.cart.ordersLeft, { count: left })
}

/** The day card's last line: "Order by Thursday 6pm · 3 orders left that day", "Too soon for every item", or why the day can't take it. */
export function dayMeta(status: CartDayStatus, date: IsoDate, view: CartDayView, window: BookingWindow, copy: CartPageCopy): string {
  const problem = dayProblem(status, date, view, window, copy)
  if (problem || !view.day) return problem ?? ""
  const deadline = view.deadline === null ? copy.cart.tooSoonAll : orderBy(view.deadline, window, copy)
  return [deadline, fewLeft(ordersLeft(view.day), copy)].filter(Boolean).join(" · ")
}

/** "7am–4pm" on that day's weekday, or null when the hours aren't set or the shop is shut that day. */
export function pickupHours(hours: OpeningHours | null, date: IsoDate, copy: CartPageCopy): string | null {
  const day = hours?.[weekdayKey(weekday(date))]
  if (!day?.open) return null
  return fill(copy.cart.details.hours, { from: formatClock(day.from), to: formatClock(day.to) })
}
