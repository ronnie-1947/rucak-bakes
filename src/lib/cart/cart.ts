import { z } from "zod"
import { type IsoDate, isIsoDate } from "@/lib/dates"

/**
 * The customer's cart, kept in `localStorage['bakery.cart']` (dev-docs/implementation.md 6.3). Client-safe, pure.
 *
 * One cart is for ONE fulfilment day. Its prices are what the customer was shown — display only: the server
 * prices the order itself.
 */

export const CART_KEY = "bakery.cart"

/** A cart untouched for this long is dropped. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000

/** Per line — the cart's and the item page's stepper go up to this; it also stops a corrupted entry from rendering nonsense. */
export const MAX_LINE_QTY = 99

const lineSchema = z.object({
  menuItemId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  priceSnapshot: z.number().int().nonnegative(),
  qty: z.number().int().min(1).max(MAX_LINE_QTY),
  imageId: z.string().nullable(),
  /** The item's notice when it was added, refreshed by the live check — the deadline rule needs it. Older carts lack it. */
  noticeDays: z.number().int().min(0).max(30).optional(),
})

const cartSchema = z.object({
  items: z.array(lineSchema),
  fulfilmentDate: z.string().refine(isIsoDate),
  updatedAt: z.number().int(),
})

export type CartLine = z.infer<typeof lineSchema>
export type Cart = z.infer<typeof cartSchema>

/** What an Add button puts in the cart. `max` caps the quantity (MAX_LINE_QTY unless the screen says less). */
export type AddTarget = {
  menuItemId: string
  slug: string
  name: string
  pricePaise: number
  imageId: string | null
  date: IsoDate
  max: number
  noticeDays?: number
}

/** A stored value, or null when it is missing, unreadable or the wrong shape. */
export function parseCart(raw: string | null): Cart | null {
  if (!raw) return null
  try {
    const parsed = cartSchema.safeParse(JSON.parse(raw))
    return parsed.success && parsed.data.items.length > 0 ? parsed.data : null
  } catch {
    return null
  }
}

/** Older than a day, or for a day that has gone. */
export function isStale(cart: Cart, today: IsoDate, now: number): boolean {
  return cart.fulfilmentDate < today || now - cart.updatedAt > MAX_AGE_MS
}

/** Adding for another day than the cart's needs the customer's say-so first — it clears the cart. */
export function conflictsWith(cart: Cart | null, date: IsoDate): boolean {
  return Boolean(cart && cart.items.length > 0 && cart.fulfilmentDate !== date)
}

export function quantityOf(cart: Cart | null, menuItemId: string, date: IsoDate): number {
  if (!cart || cart.fulfilmentDate !== date) return 0
  return cart.items.find((line) => line.menuItemId === menuItemId)?.qty ?? 0
}

export function cartCount(cart: Cart | null): number {
  return cart ? cart.items.reduce((sum, line) => sum + line.qty, 0) : 0
}

/** What the customer was shown — never sent as a price. */
export function cartSubtotal(cart: Cart | null): number {
  return cart ? cart.items.reduce((sum, line) => sum + line.qty * line.priceSnapshot, 0) : 0
}

/**
 * The cart with `target` set to `qty` (0 removes the line). A cart for another day is replaced, so call
 * this only once the customer has agreed to that. Re-adding refreshes the line's name and price.
 */
export function withQuantity(cart: Cart | null, target: AddTarget, qty: number, now: number): Cart | null {
  const base = cart && cart.fulfilmentDate === target.date ? cart.items : []
  const clamped = Math.max(0, Math.min(qty, target.max, MAX_LINE_QTY))
  const line: CartLine = {
    menuItemId: target.menuItemId,
    slug: target.slug,
    name: target.name,
    priceSnapshot: target.pricePaise,
    qty: clamped,
    imageId: target.imageId,
    ...(target.noticeDays === undefined ? {} : { noticeDays: target.noticeDays }),
  }
  const exists = base.some((existing) => existing.menuItemId === target.menuItemId)
  const items = exists
    ? base.flatMap((existing) => (existing.menuItemId !== target.menuItemId ? [existing] : clamped > 0 ? [line] : []))
    : clamped > 0
      ? [...base, line]
      : base
  return items.length > 0 ? { items, fulfilmentDate: target.date, updatedAt: now } : null
}
