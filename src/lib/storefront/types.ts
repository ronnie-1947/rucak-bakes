import type { IsoDate } from "@/lib/dates"
import type { PriceUnit } from "@/lib/menu/units"

/**
 * What the customer screens are shown about a fulfilment day and its items. Client-safe — the read models
 * that fill these live beside it (`landing.ts`, `item.ts`, `shell.ts`).
 */

/**
 * Whether a day takes orders, judged the way `placeOrder` will judge the submit (src/lib/orders/place.ts),
 * in its order: paused, closed, past cutoff, full. `unplanned` — no MenuDay row yet.
 */
export type DayStatus = "open" | "full" | "cutoff" | "closed" | "unplanned" | "paused"

/** "Selling fast" / "Only 2 left" from here down. */
export const FEW_LEFT = 3

export type StoreItem = {
  id: string
  slug: string
  name: string
  /** Cover public_id. */
  image: string | null
  /** The owner's alt text for the cover, "" when none — the card's name sits beside it either way. */
  imageAlt: string
  /** This day's price (override, else base) — display only; the server prices the order. */
  pricePaise: number
  priceUnit: PriceUnit
}

export type DayItem = StoreItem & {
  /** quantityAvailable − quantityOrdered, never below 0. */
  left: number
}

export type StoreDay = {
  date: IsoDate
  status: DayStatus
  /** Order requests the day still accepts: overbookLimit − live orders, never below 0. */
  left: number
  /** overbookLimit — what `taken` is measured against on the capacity bar. */
  capacity: number
  /** Live orders (pending or verified). */
  taken: number
  /** When ordering closes, bakery-local: its date and "18:00". Null when there's no MenuDay. */
  cutoff: { date: IsoDate; time: string } | null
  /** The owner's line for customers: the closure note on a closed day, else the day's public note. */
  note: string | null
  /** In the bakery's category order, then by name. Empty on a closed or unplanned day. */
  items: DayItem[]
}

/** One item on one day of the order-ahead window — a pickup-day chip on the item page. */
export type ItemDay = {
  date: IsoDate
  status: DayStatus
  /** On that day's menu. False when the day is closed or unplanned, or the owner didn't put the item on it. */
  listed: boolean
  /** That day's price (override, else base) — display only. */
  pricePaise: number
  /** quantityAvailable − quantityOrdered, never below 0. 0 when not listed. */
  left: number
  /** quantityAvailable — what `left` is measured against. 0 when not listed. */
  quantity: number
  /** Null when there's no MenuDay. */
  cutoff: { date: IsoDate; time: string } | null
}

export type CatalogueItem = StoreItem & {
  /** The first open day after tomorrow that has it, within the order-ahead window — "Back Thursday". */
  next: IsoDate | null
}

/** The strip across the top of every customer screen. Pause beats the announcement. */
export type StoreBanner = { kind: "paused"; reason: string | null } | { kind: "note"; text: string }
