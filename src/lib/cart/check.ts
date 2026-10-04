import type { IsoDate } from "@/lib/dates"
import type { DayStatus } from "@/lib/storefront/types"
import { type Cart, type CartLine, MAX_LINE_QTY } from "./cart"

/**
 * The cart checked against the live menu (dev-docs/implementation.md 6.3: "revalidate on mount"). The server
 * answers with a CartCheck (storefront/cart.ts `checkLines`); `reconcile` applies it. Client-safe, pure.
 */

/** One cart line as the day's menu has it now. */
export type LineCheck = {
  menuItemId: string
  slug: string
  name: string
  image: string | null
  /** On the day's menu and orderable. */
  listed: boolean
  /** What the day has left of it; 0 when not listed. */
  left: number
  /** The day's price (override, else base) — display only. */
  pricePaise: number
}

export type CartCheck = {
  date: IsoDate
  status: DayStatus
  /** Lines whose item no longer exists are missing. */
  lines: LineCheck[]
}

/** What changed on a line — a tag beside its price. A sold-out line stays, so the customer sees what went. */
export type LineNote = "price" | "fewer" | "soldOut"

export type Reconciled = {
  cart: Cart | null
  notes: Record<string, LineNote>
  /** Names of lines taken out — not on that day's menu (or, moving day, nothing left of them). */
  removed: string[]
  /** What each line can go up to. */
  max: Record<string, number>
}

/**
 * The cart as `check` says it stands: lines off the menu removed, quantities above what's left lowered,
 * prices, names and photos refreshed. A line with none left stays, flagged, so the customer removes it
 * knowingly — unless the cart is moving to `check.date` from another day, when it simply doesn't come along.
 */
export function reconcile(cart: Cart, check: CartCheck, now: number): Reconciled {
  const moving = cart.fulfilmentDate !== check.date
  const byId = new Map(check.lines.map((line) => [line.menuItemId, line]))
  const notes: Record<string, LineNote> = {}
  const removed: string[] = []
  const max: Record<string, number> = {}

  const items = cart.items.flatMap((line): CartLine[] => {
    const fresh = byId.get(line.menuItemId)
    if (!fresh?.listed || (moving && fresh.left === 0)) {
      removed.push(fresh?.name ?? line.name)
      return []
    }
    max[line.menuItemId] = Math.min(fresh.left, MAX_LINE_QTY)
    if (fresh.left === 0) notes[line.menuItemId] = "soldOut"
    else if (line.qty > fresh.left) notes[line.menuItemId] = "fewer"
    else if (!moving && fresh.pricePaise !== line.priceSnapshot) notes[line.menuItemId] = "price"
    return [
      {
        menuItemId: line.menuItemId,
        slug: fresh.slug,
        name: fresh.name,
        priceSnapshot: fresh.pricePaise,
        imageId: fresh.image,
        qty: fresh.left === 0 ? line.qty : Math.min(line.qty, fresh.left),
      },
    ]
  })

  const unchanged = !moving && removed.length === 0 && items.every((line, index) => sameLine(line, cart.items[index]))
  const next = unchanged ? cart : items.length > 0 ? { items, fulfilmentDate: check.date, updatedAt: now } : null
  return { cart: next, notes, removed, max }
}

function sameLine(a: CartLine, b: CartLine | undefined): boolean {
  return Boolean(
    b &&
    a.menuItemId === b.menuItemId &&
    a.qty === b.qty &&
    a.priceSnapshot === b.priceSnapshot &&
    a.name === b.name &&
    a.slug === b.slug &&
    a.imageId === b.imageId,
  )
}
