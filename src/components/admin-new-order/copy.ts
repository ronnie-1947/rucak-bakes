import { formatClock } from "@/lib/calendar/cutoffs"
import { formatLongDayLabel, formatTimeIn, formatWeekday, type IsoDate, isoDateInZone } from "@/lib/dates"
import { formatPaise } from "@/lib/money"
import type { MissingStep, StaffOrderWarning } from "@/lib/orders/staff-order"
import { noticeLength } from "@/lib/storefront/words"
import { fill } from "@/lib/template"
import type { FormCopy, FormLine, Mode, NewOrderCopy, Refusal } from "./types"

/** The screen's sentences, built from the dict. Client-safe, pure. */

/** "Orders for Saturday closed at 6pm Friday — …", "Custom birthday cake usually needs 3 days’ notice — …", "1 custom price — ₹300 below the menu." */
export function warningText(warning: StaffOrderWarning, timeZone: string, dict: NewOrderCopy): string {
  const w = dict.warnings
  if (warning.kind === "pastCutoff") {
    const cutoff = new Date(warning.cutoffAt)
    return fill(w.pastCutoff, {
      day: formatWeekday(warning.date),
      time: formatClock(formatTimeIn(cutoff, timeZone)),
      weekday: formatWeekday(isoDateInZone(cutoff, timeZone)),
    })
  }
  if (warning.kind === "tooSoon") {
    return fill(w.tooSoon, { name: warning.name, notice: noticeLength(warning.noticeDays, { oneDay: w.noticeOne, days: w.notice }) })
  }
  if (warning.differencePaise === 0) return fill(w.pricesEven, { count: warning.count })
  return fill(warning.count === 1 ? w.pricesOne : w.prices, {
    count: warning.count,
    amount: formatPaise(Math.abs(warning.differencePaise)),
    direction: warning.differencePaise < 0 ? w.below : w.above,
  })
}

/** "Saturday 10 Oct · pickup at 11am", "… · pickup, any time", "… · delivery to 12 Temple Street". */
export function whenText(date: IsoDate | null, mode: Mode, time: string, address: string, dict: NewOrderCopy): string {
  const s = dict.summary
  if (!date) return s.noDate
  const day = formatLongDayLabel(date)
  if (mode === "DELIVERY") return address.trim() ? fill(s.deliveryTo, { date: day, address: address.trim() }) : fill(s.delivery, { date: day })
  return time ? fill(s.pickupAt, { date: day, time: formatClock(time) }) : fill(s.pickupAny, { date: day })
}

/** "₹1,200 per kg", or "₹1,200 per kg · menu ₹1,500" when the price is custom. */
export function eachText(line: FormLine, dict: FormCopy): string {
  const unit = dict.priceUnits[line.unit]
  const price = formatPaise(line.unitPricePaise)
  const s = dict.newOrder.summary
  return line.custom ? fill(s.eachMenu, { price, unit, menu: formatPaise(line.menuPricePaise) }) : fill(s.each, { price, unit })
}

/** The Add order button's label: what's still missing, else Add order (or Adding… while it sends). */
export function addLabel(missing: MissingStep | null, pending: boolean, dict: NewOrderCopy): string {
  if (pending) return dict.adding
  return missing ? dict.missing[missing] : dict.add
}

/** Why the last Add order was refused, in a sentence. */
export function refusalText(refusal: Refusal, dict: NewOrderCopy): string {
  const r = dict.refusals
  if (refusal.kind === "closed") return fill(r.closed, { day: formatWeekday(refusal.date) })
  if (refusal.kind === "past") return fill(r.past, { day: formatWeekday(refusal.date) })
  if (refusal.kind === "item") return refusal.name ? fill(r.item, { name: refusal.name }) : r.itemUnknown
  if (refusal.kind === "invalid") return refusal.field ? fill(r.invalid, { field: r.fields[refusal.field] }) : r.invalidUnknown
  return r.network
}
