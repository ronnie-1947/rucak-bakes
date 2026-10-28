import { type AddTarget, MAX_LINE_QTY } from "@/lib/cart/cart"
import { formatClock } from "@/lib/calendar/cutoffs"
import { formatDayLabel, formatLongDayLabel, formatShortWeekday, formatTimeIn, formatWeekday, type IsoDate, isoDateInZone } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import { type Availability, type BookingWindow, dayAvailability, deadlineFor, FEW_ORDERS_LEFT, ordersLeft } from "@/lib/orders/deadline"
import { noticeLength, relativeDay } from "@/lib/storefront/words"
import { fill } from "@/lib/template"

/**
 * The item page's date strip (§10R): each date of the booking window judged for this item by the deadline rule
 * (orders/deadline.ts) — the same functions placeOrder and the cart use — then handed to the client panel as plain data,
 * one entry per chip. Client-safe, pure.
 */

/** The store strings the item page uses — all the browser gets of `dict.store`. */
export type ItemCopy = Pick<Dict["store"], "itemPage" | "item" | "notice" | "allergens" | "days">

type StoreCopy = ItemCopy

/** `open` takes the order · `soon` the item's notice (or the day's cutoff) has passed · `closed` · `full` fully booked. */
export type DateLook = "open" | "soon" | "closed" | "full"

export type DateOption = {
  date: IsoDate
  /** The chip: "Sat" over "10". */
  weekday: string
  day: string
  look: DateLook
  /** The chip's title and the second half of its name: "Open", "Only 2 orders left", "Fully booked", "Too soon — …". */
  status: string
  /** The chip's accessible name: "Sat 10 Oct, Open". */
  label: string
  /** Tapped while it can't be picked: "Fri 9 Oct · Fully booked". */
  refusal: string | null
  /** Picked: "Pickup Saturday 10 Oct · order by Friday 6pm". */
  line: string
  /** "Only 2 orders left that day" — three or fewer. */
  fewLeft: string | null
  /** What Add to cart puts in the cart; null when the date can't take the order. */
  target: AddTarget | null
  /** "Saturday", "tomorrow" — "2 in your cart for Saturday". */
  when: string
}

/** The strings the client panel needs — not the whole dict. */
export type OrderCopy = {
  chooseDate: string
  add: string
  addPlain: string
  viewCart: string
  inCart: string
  decrease: string
  increase: string
}

export type ItemIdentity = { id: string; slug: string; name: string; image: string | null; pricePaise: number; noticeDays: number }

export type CutoffDefault = { time: string; daysBefore: number }

const looks: Record<Availability, DateLook> = {
  open: "open",
  tooSoon: "soon",
  past: "soon",
  closed: "closed",
  full: "full",
  tooFar: "closed",
}

/** "6pm the day before", "11am the same day", "6pm, 2 days before" — the default cutoff in words. */
export function cutoffPhrase(cutoff: CutoffDefault, dict: StoreCopy["itemPage"]["cutoff"]): string {
  const template = cutoff.daysBefore === 0 ? dict.sameDay : cutoff.daysBefore === 1 ? dict.dayBefore : dict.daysBefore
  return fill(template, { time: formatClock(cutoff.time), count: cutoff.daysBefore })
}

/** "Too soon — needs 2 days’ notice"; with no notice of its own, "Too soon — orders close 6pm the day before". The legend says it too. */
export function soonText(noticeDays: number, cutoff: CutoffDefault, dict: StoreCopy): string {
  const s = dict.itemPage.dateStatus
  return noticeDays === 0
    ? fill(s.soonCutoff, { cutoff: cutoffPhrase(cutoff, dict.itemPage.cutoff) })
    : fill(s.soon, { notice: noticeLength(noticeDays, dict.notice) })
}

/** "6pm today", "Friday 6pm" — a deadline (epoch ms), bakery-local. */
function deadlineText(deadline: number, window: BookingWindow, dict: StoreCopy["itemPage"]): string {
  const instant = new Date(deadline)
  const time = formatClock(formatTimeIn(instant, window.timeZone))
  const date = isoDateInZone(instant, window.timeZone)
  return date === window.today ? fill(dict.byToday, { time }) : fill(dict.byDay, { weekday: formatWeekday(date), time })
}

/** Every date of the booking window as a chip. None while ordering is paused — no date can take an order then. */
export function dateOptions(window: BookingWindow, item: ItemIdentity, cutoff: CutoffDefault, dict: StoreCopy): DateOption[] {
  if (window.paused) return []
  const d = dict.itemPage
  const s = d.dateStatus
  const notices = [item.noticeDays]
  const soon = soonText(item.noticeDays, cutoff, dict)

  return window.days.map((day) => {
    const look = looks[dayAvailability(day, notices, window)]
    const left = ordersLeft(day)
    const few = look === "open" && left <= FEW_ORDERS_LEFT
    const openStatus = !few ? s.open : left === 1 ? s.leftOne : fill(s.left, { count: left })
    const status = look === "open" ? openStatus : look === "soon" ? soon : s[look]
    const shortDate = formatDayLabel(day.date)
    return {
      date: day.date,
      weekday: formatShortWeekday(day.date),
      day: String(Number(day.date.slice(8, 10))),
      look,
      status,
      label: fill(d.dateLabel, { date: shortDate, status }),
      refusal: look === "open" ? null : fill(d.refusal, { date: shortDate, status }),
      line: fill(d.pickup, { date: formatLongDayLabel(day.date), deadline: deadlineText(deadlineFor(day, notices, window.timeZone), window, d) }),
      fewLeft: few ? (left === 1 ? d.fewLeftOne : fill(d.fewLeft, { count: left })) : null,
      target:
        look === "open"
          ? {
              menuItemId: item.id,
              slug: item.slug,
              name: item.name,
              pricePaise: item.pricePaise,
              imageId: item.image,
              date: day.date,
              max: MAX_LINE_QTY,
              noticeDays: item.noticeDays,
            }
          : null,
      when: relativeDay(day.date, window.today, dict.days),
    }
  })
}

/** The date the page opens on: the one the link asked for (?day=) when it's open, else the first open one, else none. */
export function initialDate(options: DateOption[], asked: string | undefined): IsoDate | null {
  return (options.find((option) => option.date === asked && option.look === "open") ?? options.find((option) => option.look === "open"))?.date ?? null
}

export function orderCopy(dict: StoreCopy): OrderCopy {
  const d = dict.itemPage
  return {
    chooseDate: d.chooseDate,
    add: d.add,
    addPlain: d.addPlain,
    viewCart: d.viewCart,
    inCart: d.inCart,
    decrease: dict.item.decrease,
    increase: dict.item.increase,
  }
}
