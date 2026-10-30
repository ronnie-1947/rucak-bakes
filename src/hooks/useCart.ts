"use client"

import { createContext, useContext } from "react"
import type { AddTarget, Cart, CartLine } from "@/lib/cart/cart"

export type CartApi = {
  /** Null while empty — and on the server and the first client render, before localStorage is read. */
  cart: Cart | null
  count: number
  /** Display only. */
  subtotalPaise: number
  /** How many of an item the cart holds for `date` — 0 when the cart is for another day. */
  quantityOf: (menuItemId: string, date: string) => number
  /** The item's line for `date` — its size, for a by-weight item. Null when the cart is for another day or hasn't got it. */
  lineOf: (menuItemId: string, date: string) => CartLine | null
  /**
   * Set an item's quantity for its day (0 removes it). When the cart holds another day's items, this asks
   * "Switch to Saturday?" first and only goes ahead on yes.
   */
  setQuantity: (target: AddTarget, qty: number) => void
  /** Swap the whole cart without asking — the cart page applying the live menu, or moving to another day. */
  replace: (cart: Cart | null) => void
  clear: () => void
}

export const CartContext = createContext<CartApi | null>(null)

/** Inside a CartProvider (src/components/store-shell/). */
export function useCart(): CartApi {
  const api = useContext(CartContext)
  if (!api) throw new Error("useCart must be used inside <CartProvider>")
  return api
}
