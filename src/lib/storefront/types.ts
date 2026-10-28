import type { IsoDate } from "@/lib/dates"
import type { PriceUnit } from "@/lib/menu/units"
import type { OpeningHours } from "@/lib/settings/hours"

/**
 * What the customer screens are shown about menu items and today's counter (§10R). Client-safe — the read models that
 * fill these live beside it (`landing.ts`, `item.ts`, `counter.ts`, `shell.ts`).
 */

export type StoreItem = {
  id: string
  slug: string
  name: string
  /** Cover public_id. */
  image: string | null
  /** The owner's alt text for the cover, "" when none — the card's name sits beside it either way. */
  imageAlt: string
  /** Display only. The menu shows the base price (orders are priced at it); Fresh today shows the counter's price for the day. */
  pricePaise: number
  priceUnit: PriceUnit
  /** Off → call only: "Call to order", never in a cart. */
  orderable: boolean
  /** Days of notice an online order needs (orders/deadline.ts). */
  noticeDays: number
}

/** One of today's counter-items — Fresh today. */
export type CounterItem = StoreItem & { soldOut: boolean }

/** A card in "Everything we bake". */
export type CatalogueItem = StoreItem & {
  /** The category's slug, for the filter chips. */
  category: string | null
  /** On today's counter, sold out or not — "On the counter today". */
  onCounter: boolean
  /** The booking window's dates an online order can be placed for now, earliest first — Add to cart picks one. Empty: call only, or none open. */
  dates: IsoDate[]
}

/** `on` counter-items to walk in for · `soldOut` every one gone · `none` open, orders only · `closed` closed today. */
export type FreshState = "on" | "soldOut" | "none" | "closed"

export type FreshToday = {
  state: FreshState
  /** Today's counter-items, in the menu's order. Empty when closed. */
  items: CounterItem[]
  /** When the counter closes today, "16:00" — the opening hours' closing time. Null until the hours are saved. */
  closes: string | null
  /** Closed today: the next date the bakery opens, within the order-ahead window — "back Tuesday". */
  back: IsoDate | null
}

/** The strip across the top of every customer screen. Pause beats the announcement. */
export type StoreBanner = { kind: "paused"; reason: string | null } | { kind: "note"; text: string }

/** The bakery's settings every customer screen may need — in the static store shell, revalidated when the owner saves them. */
export type StoreInfo = {
  /** IANA — "today" is worked out in the browser from it, since the shell is prerendered. */
  timeZone: string
  pickup: {
    enabled: boolean
    /** The pickup address, one entry per line. */
    address: string[]
    /** Null until the owner first saves them. */
    hours: OpeningHours | null
  }
  delivery: { enabled: boolean; feePaise: number; radiusKm: number | null }
  /** E.164, or null when the owner hasn't given one. */
  phone: string | null
}
