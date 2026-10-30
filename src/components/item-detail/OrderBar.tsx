"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { useCart } from "@/hooks/useCart"
import type { AddTarget } from "@/lib/cart/cart"
import { defaultSize, formatWeight, sizedPrice } from "@/lib/menu/sizes"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import type { DateOption, OrderCopy } from "./availability"
import { SizeSelect } from "./SizeSelect"

type OrderBarProps = {
  /** The picked date; null before one is picked. */
  day: DateOption | null
  name: string
  /** PER_KG — sizes are weights, and the target's price is per kg. */
  byWeight: boolean
  dict: OrderCopy
}

/** A sticky bar on phones, clear of the home indicator; from 768px it sits in the panel under the line. */
const bar =
  "fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 border-t border-border bg-background px-4 pt-3 pb-safe shadow-raised md:static md:z-auto md:border-0 md:p-0 md:shadow-none print:hidden"

/**
 * The size and Add to cart. The size starts on the smallest (0.5 kg for a by-weight item, each piece priced at its weight; 1
 * for anything else) and the select offers every other: 0.5 kg … 5 kg, or 1, 2, 3 …. Then "Add to cart · ₹500", the total
 * moving with the size (the plain label below 375px, where the total won't fit beside it). Once the item is in the cart for
 * that date the select edits the cart's line itself and the button becomes View cart, which takes focus; the cart page takes
 * it out. Only a date that takes the order can be picked, so there's always something to add. Adding for another date than
 * the cart's asks first (CartProvider's dialog).
 */
export function OrderBar({ day, name, byWeight, dict }: OrderBarProps) {
  const { lineOf, setQuantity } = useCart()
  const [size, setSize] = useState(() => defaultSize(byWeight))
  const viewCart = useRef<HTMLAnchorElement>(null)
  const added = useRef(false)
  const target = day?.target ?? null
  const line = target ? lineOf(target.menuItemId, target.date) : null
  const inCart = line?.qty ?? 0

  useEffect(() => {
    if (inCart === 0 || !added.current) return
    added.current = false
    viewCart.current?.focus()
  }, [inCart])

  if (!day || !target) return null

  /** The target for `grams` — one piece of that size, priced at its weight. */
  const sized = (grams: number): AddTarget => ({ ...target, grams, pricePaise: sizedPrice(target.pricePaise, grams) })
  const put = (value: number, qty: number) => (byWeight ? setQuantity(sized(value), qty) : setQuantity(target, value))
  const select = { byWeight, max: target.max, placeholder: byWeight ? dict.pickWeight : dict.pickCount, label: fill(dict.sizeLabel, { name }) }

  const picked = byWeight ? size : Math.min(size, target.max)
  const total = byWeight ? sizedPrice(target.pricePaise, picked) : target.pricePaise * picked
  const status = !line
    ? ""
    : line.grams
      ? fill(dict.inCartSized, { size: formatWeight(line.grams), day: day.when })
      : fill(dict.inCart, { count: inCart, day: day.when })

  return (
    <div className={bar}>
      <div className="flex items-center gap-3">
        {line ? (
          <>
            <SizeSelect value={byWeight ? (line.grams ?? null) : inCart} onChange={(value) => put(value, inCart)} {...select} />
            <ButtonLink ref={viewCart} href="/cart" size="block" className="min-w-0 flex-1 font-semibold">
              {dict.viewCart}
            </ButtonLink>
          </>
        ) : (
          <>
            <SizeSelect value={picked} onChange={setSize} {...select} />
            <Button
              size="block"
              className="min-w-0 flex-1 font-semibold"
              onClick={() => {
                added.current = true
                put(picked, 1)
              }}
            >
              <span className="xxs:hidden">{dict.addPlain}</span>
              <span className="hidden xxs:inline">{fill(dict.add, { total: formatPaise(total) })}</span>
            </Button>
          </>
        )}
      </div>
      <span role="status" className="sr-only">
        {status}
      </span>
    </div>
  )
}
