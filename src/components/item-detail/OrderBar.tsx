"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { Stepper } from "@/components/ui/Stepper"
import { useCart } from "@/hooks/useCart"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import type { DateOption, OrderCopy } from "./availability"

type OrderBarProps = {
  /** The picked date; null before one is picked. */
  day: DateOption | null
  name: string
  dict: OrderCopy
}

/** A sticky bar on phones, clear of the home indicator; from 768px it sits in the panel under the line. */
const bar =
  "fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 border-t border-border bg-background px-4 pt-3 pb-safe shadow-raised md:static md:z-auto md:border-0 md:p-0 md:shadow-none print:hidden"

/**
 * The quantity (1–99) and Add to cart — "Add to cart · ₹480", the total moving with the stepper (the plain label below
 * 375px, where the total won't fit beside it). Once the item is in the cart for that date the stepper edits the cart itself
 * (0 takes it out) and the button becomes View cart, which takes focus. Only a date that takes the order can be picked, so
 * there's always something to add. Adding for another date than the cart's asks first (CartProvider's dialog).
 */
export function OrderBar({ day, name, dict }: OrderBarProps) {
  const { quantityOf, setQuantity } = useCart()
  const [qty, setQty] = useState(1)
  const viewCart = useRef<HTMLAnchorElement>(null)
  const added = useRef(false)
  const target = day?.target ?? null
  const inCart = target ? quantityOf(target.menuItemId, target.date) : 0

  useEffect(() => {
    if (inCart === 0 || !added.current) return
    added.current = false
    viewCart.current?.focus()
  }, [inCart])

  if (!day || !target) return null

  const picked = Math.min(qty, target.max)
  const labels = { decreaseLabel: fill(dict.decrease, { name }), increaseLabel: fill(dict.increase, { name }) }
  return (
    <div className={bar}>
      <div className="flex items-center gap-3">
        {inCart > 0 ? (
          <>
            <Stepper size="lg" value={inCart} min={0} max={target.max} onChange={(value) => setQuantity(target, value)} {...labels} />
            <ButtonLink ref={viewCart} href="/cart" size="block" className="min-w-0 flex-1 font-semibold">
              {dict.viewCart}
            </ButtonLink>
          </>
        ) : (
          <>
            <Stepper size="lg" value={picked} min={1} max={target.max} onChange={setQty} {...labels} />
            <Button
              size="block"
              className="min-w-0 flex-1 font-semibold"
              onClick={() => {
                added.current = true
                setQuantity(target, picked)
              }}
            >
              <span className="xxs:hidden">{dict.addPlain}</span>
              <span className="hidden xxs:inline">{fill(dict.add, { total: formatPaise(target.pricePaise * picked) })}</span>
            </Button>
          </>
        )}
      </div>
      <span role="status" className="sr-only">
        {inCart > 0 ? fill(dict.inCart, { count: inCart, day: day.when }) : ""}
      </span>
    </div>
  )
}
