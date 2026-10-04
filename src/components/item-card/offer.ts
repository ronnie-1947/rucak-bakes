import type { TagTone } from "@/components/ui/Tag"
import type { AddTarget } from "@/lib/cart/cart"
import { formatClock } from "@/lib/calendar/cutoffs"
import type { IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import { formatPaise } from "@/lib/money"
import { type CatalogueItem, type DayItem, FEW_LEFT, type StoreDay, type StoreItem } from "@/lib/storefront/types"
import { relativeDay } from "@/lib/storefront/words"
import { fill } from "@/lib/template"

/**
 * What a card's Add does, or why it can't — worked out on the server from the same rules placeOrder applies,
 * then handed to the card as plain data. Client-safe.
 */

type StoreCopy = Dict["store"]

export type Offer = {
  /** Null: Add is disabled and `reason` says why. */
  target: AddTarget | null
  /** "Orders for today closed at 6pm yesterday" — under a disabled Add. */
  reason: string | null
  /** "For tomorrow" — under an Add that isn't for the day the customer is looking at. */
  hint: string | null
}

export type ItemChip = { text: string; tone: TagTone }

/** "₹240" and, when it isn't per piece, "per box". */
export function priceParts(item: StoreItem, dict: StoreCopy["item"]): { price: string; unit: string } {
  return { price: formatPaise(item.pricePaise), unit: dict.units[item.priceUnit] }
}

/** Why nothing can be added for this day, or null when it takes orders. */
export function dayReason(day: StoreDay, today: IsoDate, dict: StoreCopy): string | null {
  const r = dict.item.reasons
  const name = relativeDay(day.date, today, dict.days)
  switch (day.status) {
    case "open":
      return null
    case "paused":
      return r.paused
    case "closed":
      return fill(r.closed, { day: name })
    case "unplanned":
      return fill(r.unplanned, { day: name })
    case "full":
      return fill(r.full, { day: name })
    case "cutoff":
      return day.cutoff
        ? fill(r.cutoff, { day: name, time: formatClock(day.cutoff.time), when: relativeDay(day.cutoff.date, today, dict.days) })
        : fill(r.closed, { day: name })
  }
}

/** The item on one day's menu. */
export function dayOffer(item: DayItem, day: StoreDay, today: IsoDate, dict: StoreCopy, hint: string | null = null): Offer {
  const reason = dayReason(day, today, dict)
  if (reason) return { target: null, reason, hint: null }
  if (item.left <= 0) return { target: null, reason: fill(dict.item.reasons.soldOut, { day: relativeDay(day.date, today, dict.days) }), hint: null }
  return {
    target: { menuItemId: item.id, slug: item.slug, name: item.name, pricePaise: item.pricePaise, imageId: item.image, date: day.date, max: item.left },
    reason: null,
    hint,
  }
}

/** Sold out (the item, or the whole day) in red; the last few in warm. */
export function dayChip(item: DayItem, day: StoreDay, dict: StoreCopy["item"]): ItemChip | null {
  if (day.status === "full" || item.left <= 0) return { text: dict.soldOut, tone: "red" }
  if (day.status === "open" && item.left <= FEW_LEFT) return { text: fill(dict.fewLeft, { count: item.left }), tone: "warm" }
  return null
}

export type CatalogueCard = {
  /** The item as priced for the day its Add is for, else at its base price. */
  item: StoreItem
  offer: Offer
  chip: ItemChip | null
  /** The day the card is about — its Add's, or the first of today / tomorrow that has it. Null when neither does. */
  day: IsoDate | null
  /** On neither today's nor tomorrow's menu: faded, "Not today" — still opens its page. */
  muted: boolean
}

/**
 * An item in "Everything we bake". Add goes to the first of today / tomorrow that has it and still takes
 * orders ("For tomorrow" when that isn't today); otherwise it says why the first day that has it can't.
 * An item on neither day is faded with "Not today" and when it's back.
 */
export function catalogueCard(item: CatalogueItem, days: StoreDay[], today: IsoDate, dict: StoreCopy): CatalogueCard {
  const listed = days.flatMap((day) => {
    const line = day.items.find((dayItem) => dayItem.id === item.id)
    return line ? [{ day, line }] : []
  })
  if (listed.length === 0) {
    const reason = item.next ? fill(dict.item.reasons.back, { day: relativeDay(item.next, today, dict.days) }) : dict.item.reasons.notThisWeek
    return { item, offer: { target: null, reason, hint: null }, chip: { text: dict.item.notToday, tone: "quiet" }, day: null, muted: true }
  }
  const pick = listed.find(({ day, line }) => day.status === "open" && line.left > 0) ?? listed[0]
  const hint = pick.day.date === today ? null : fill(dict.item.forDay, { day: relativeDay(pick.day.date, today, dict.days) })
  return {
    item: pick.line,
    offer: dayOffer(pick.line, pick.day, today, dict, hint),
    chip: dayChip(pick.line, pick.day, dict.item),
    day: pick.day.date,
    muted: false,
  }
}
