"use client"

import { type ReactNode, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { CartContext, type CartApi } from "@/hooks/useCart"
import { type AddTarget, cartCount, cartSubtotal, conflictsWith, isStale, quantityOf, withQuantity } from "@/lib/cart/cart"
import { getCart, getServerCart, subscribeCart, writeCart } from "@/lib/cart/store"
import type { IsoDate } from "@/lib/dates"
import type { CartCopy } from "./copy"
import { SwitchDayDialog } from "./SwitchDayDialog"

type CartProviderProps = {
  /** Bakery-local — a cart for an earlier day is dropped. */
  today: IsoDate
  dict: CartCopy
  children: ReactNode
}

/**
 * The cart for every customer screen: localStorage through an external store, so other tabs stay in step. On
 * mount it drops a cart that is over a day old or for a day that has gone. Owns the one "Switch to …?" dialog.
 */
export function CartProvider({ today, dict, children }: CartProviderProps) {
  const cart = useSyncExternalStore(subscribeCart, getCart, getServerCart)
  const [pending, setPending] = useState<{ target: AddTarget; qty: number } | null>(null)

  useEffect(() => {
    const stored = getCart()
    if (stored && isStale(stored, today, Date.now())) writeCart(null)
  }, [today])

  const api = useMemo<CartApi>(
    () => ({
      cart,
      count: cartCount(cart),
      subtotalPaise: cartSubtotal(cart),
      quantityOf: (menuItemId, date) => quantityOf(cart, menuItemId, date),
      setQuantity: (target, qty) => {
        const current = getCart()
        if (qty > 0 && conflictsWith(current, target.date)) setPending({ target, qty })
        else writeCart(withQuantity(current, target, qty, Date.now()))
      },
      replace: writeCart,
      clear: () => writeCart(null),
    }),
    [cart],
  )

  return (
    <CartContext value={api}>
      {children}
      <SwitchDayDialog
        request={pending && cart ? { from: cart.fulfilmentDate, to: pending.target.date, count: cartCount(cart) } : null}
        today={today}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) writeCart(withQuantity(null, pending.target, pending.qty, Date.now()))
          setPending(null)
        }}
        dict={dict}
      />
    </CartContext>
  )
}
