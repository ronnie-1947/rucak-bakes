import type { AddTarget } from "@/lib/cart/cart"
import { formatClock } from "@/lib/calendar/cutoffs"
import { addDays, formatLongDayLabel, formatShortWeekday, type IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import { formatPaise } from "@/lib/money"
import type { ItemDay } from "@/lib/storefront/types"
import { relativeDay } from "@/lib/storefront/words"
import { fill } from "@/lib/template"

/**
 * What each pickup day offers on the item page — worked out on the server from the same rules placeOrder
 * applies, then handed to the client panel as plain data, one entry per chip. Client-safe, pure.
 */

type StoreCopy = Dict["store"]

/** `open` takes the order · `unavailable` has it on the menu but can't take the order · `off` doesn't have it on the menu. */
export type DayLook = "open" | "unavailable" | "off"

/** Why a day with the item can't take the order, in placeOrder's order. */
type Why = "paused" | "cutoff" | "full" | "soldOut"

export type LineTone = "green" | "red" | "muted"

export type DayOption = {
  date: IsoDate
  /** The chip: "Today", "Tomorrow", "Thu". */
  label: string
  /** The chip's accessible name: "Thu, Thursday 8 Oct, sold out". */
  ariaLabel: string
  look: DayLook
  /** Under the chips: "Available tomorrow · order by 6pm today · 9 of 10 left". */
  line: string
  /** The dot before the line. */
  tone: LineTone
  /** How much of the day's batch is already ordered — open days with some taken. */
  meter: { value: number; max: number; label: string } | null
  /** That day's price — an override changes it. */
  price: string
  /** What Add to cart puts in the cart; null when the day can't take the order. */
  target: AddTarget | null
  /** Sold out or fully booked: the bakery's phone is offered instead of Add. */
  call: boolean
  /** "tomorrow" — "2 in your cart for tomorrow". */
  when: string
}

/** The strings the client panel needs — not the whole dict. */
export type OrderCopy = {
  pickupDay: string
  /** The line when no day has the item. */
  none: string
  add: string
  addPlain: string
  viewCart: string
  inCart: string
  decrease: string
  increase: string
}

type ItemIdentity = { id: string; slug: string; name: string; image: string | null }

function why(day: ItemDay): Why | null {
  if (day.status === "paused") return "paused"
  if (day.status === "cutoff") return "cutoff"
  if (day.status === "full") return "full"
  if (day.left <= 0) return "soldOut"
  return null
}

export function dayLook(day: ItemDay): DayLook {
  if (!day.listed) return "off"
  return why(day) ? "unavailable" : "open"
}

const tones: Record<Why, LineTone> = {
  paused: "muted",
  cutoff: "muted",
  full: "red",
  soldOut: "red",
}

/** "Today", "Tomorrow", else the short weekday — the next week never repeats one. */
function chipLabel(date: IsoDate, today: IsoDate, dict: StoreCopy["itemPage"]): string {
  if (date === today) return dict.labels.today
  if (date === addDays(today, 1)) return dict.labels.tomorrow
  return formatShortWeekday(date)
}

/** "6pm" and "today" for "order by 6pm today" — empty when the day has no MenuDay (never for a listed day). */
function cutoffWords(day: ItemDay, today: IsoDate, dict: StoreCopy): { time: string; when: string } {
  return day.cutoff ? { time: formatClock(day.cutoff.time), when: relativeDay(day.cutoff.date, today, dict.days) } : { time: "", when: "" }
}

/** Each day from today through the last that has the item, as a chip with its line, price and Add target. */
export function dayOptions(days: ItemDay[], item: ItemIdentity, today: IsoDate, dict: StoreCopy): DayOption[] {
  const d = dict.itemPage
  // "— available Friday": the first other day that can take the order.
  const nextFor = (day: ItemDay) => days.find((other) => other.date !== day.date && dayLook(other) === "open")

  return days.map((day) => {
    const label = chipLabel(day.date, today, d)
    const date = formatLongDayLabel(day.date)
    const name = relativeDay(day.date, today, dict.days)
    const reason = day.listed ? why(day) : null
    const look = dayLook(day)
    const price = formatPaise(day.pricePaise)
    const base = { date: day.date, label, price, when: name }

    if (look === "off") {
      return { ...base, ariaLabel: fill(d.dayStatus, { label, date, status: d.status.off }), look, line: d.line.none, tone: "muted", meter: null, target: null, call: false }
    }
    if (!reason) {
      const taken = day.quantity - day.left
      return {
        ...base,
        ariaLabel: fill(d.day, { label, date }),
        look,
        line: fill(d.line.open, { day: name, left: day.left, quantity: day.quantity, ...cutoffWords(day, today, dict) }),
        tone: "green",
        meter: taken > 0 ? { value: taken, max: day.quantity, label: fill(d.meter, { taken, quantity: day.quantity, day: name }) } : null,
        target: { menuItemId: item.id, slug: item.slug, name: item.name, pricePaise: day.pricePaise, imageId: item.image, date: day.date, max: day.left },
        call: false,
      }
    }
    const line = reason === "cutoff" ? fill(d.line.cutoff, { day: name, ...cutoffWords(day, today, dict) }) : fill(d.line[reason], { day: name })
    const next = nextFor(day)
    return {
      ...base,
      ariaLabel: fill(d.dayStatus, { label, date, status: d.status[reason] }),
      look,
      line: next ? fill(d.line.next, { line, day: relativeDay(next.date, today, dict.days) }) : line,
      tone: tones[reason],
      meter: null,
      target: null,
      call: reason === "soldOut" || reason === "full",
    }
  })
}

/**
 * The day the page opens on: the one the link asked for (?day=) when it has the item, else the first that can
 * take the order, else the first that has it. Null when no day in the window has it.
 */
export function initialDay(options: DayOption[], asked: string | undefined): IsoDate | null {
  const listed = options.filter((option) => option.look !== "off")
  return (listed.find((option) => option.date === asked) ?? listed.find((option) => option.look === "open") ?? listed[0])?.date ?? null
}

export function orderCopy(dict: StoreCopy): OrderCopy {
  const d = dict.itemPage
  return {
    pickupDay: d.pickupDay,
    none: d.line.none,
    add: d.add,
    addPlain: d.addPlain,
    viewCart: d.viewCart,
    inCart: d.inCart,
    decrease: dict.item.decrease,
    increase: dict.item.increase,
  }
}
