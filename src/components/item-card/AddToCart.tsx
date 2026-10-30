"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { useCart } from "@/hooks/useCart"
import { type AddTarget, MAX_LINE_QTY } from "@/lib/cart/cart"
import type { IsoDate } from "@/lib/dates"
import { cardCounts, cardWeights, defaultSize, formatWeight, sizedPrice, soldByWeight } from "@/lib/menu/sizes"
import type { StoreItem } from "@/lib/storefront/types"
import { relativeDay } from "@/lib/storefront/words"
import { fill } from "@/lib/template"
import type { AddCopy } from "./card"
import { SizeChips } from "./SizeChips"

type AddToCartProps = {
  item: StoreItem
  /** The dates the item can be ordered for, earliest first — never empty. */
  dates: IsoDate[]
  today: IsoDate
  dict: AddCopy
}

/**
 * Add to cart straight from a card, size first: the usual sizes as chips (0.5, 1, 1.5, 2 kg for an item sold by weight; 1–4
 * otherwise — every size is on the item page, and the cart's line joins them when it's another) over Add to cart. The
 * smallest is picked to start with, so one tap adds it. It adds for the cart's day when the item can be had then (no
 * "Switch to …?"), else for the earliest date it can — CartProvider asks first when that clears another day's cart.
 * Once it's in, the chips edit the cart's line, and "For tomorrow" with Remove replace the button; focus follows the swap.
 * The cart page can still move the day. Sits above the card's stretched link.
 */
export function AddToCart({ item, dates, today, dict }: AddToCartProps) {
  const { cart, lineOf, setQuantity } = useCart()
  const id = useId()
  const byWeight = soldByWeight(item.priceUnit)
  const [picked, setPicked] = useState(() => defaultSize(byWeight))
  // The status line speaks only after a tap here — not when the stored cart is read on load.
  const [touched, setTouched] = useState(false)
  const focusNext = useRef<"add" | "size" | null>(null)
  const date = cart && dates.includes(cart.fulfilmentDate) ? cart.fulfilmentDate : dates[0]
  const line = lineOf(item.id, date)
  const current = line ? (byWeight ? (line.grams ?? null) : line.qty) : picked
  const day = relativeDay(date, today, dict.days)

  // Add and Remove swap places: move focus to the picked chip, or back to Add, once the swap has happened.
  useEffect(() => {
    const next = focusNext.current
    if (next === null || (next === "size") !== (line !== null)) return
    focusNext.current = null
    document.getElementById(next === "add" ? `${id}-add` : `${id}-sizes-${current}`)?.focus()
  }, [line, current, id])

  const usual = byWeight ? cardWeights : cardCounts
  const choices = current === null || usual.includes(current) ? usual : [...usual, current].sort((a, b) => a - b)
  const options = choices.map((value) => ({ value, label: byWeight ? formatWeight(value) : String(value) }))

  /** The cart target for a size — a by-weight piece priced at its weight. */
  const target = (value: number): AddTarget => ({
    menuItemId: item.id,
    slug: item.slug,
    name: item.name,
    pricePaise: byWeight ? sizedPrice(item.pricePaise, value) : item.pricePaise,
    ...(byWeight ? { grams: value } : {}),
    imageId: item.image,
    date,
    max: MAX_LINE_QTY,
    noticeDays: item.noticeDays,
  })
  const put = (value: number, focus: "size" | null) => {
    focusNext.current = focus
    setTouched(true)
    setQuantity(target(value), byWeight ? (line?.qty ?? 1) : value)
  }
  const remove = () => {
    focusNext.current = "add"
    setTouched(true)
    setPicked(current ?? defaultSize(byWeight))
    setQuantity(target(current ?? 1), 0)
  }

  const status =
    !touched || !line
      ? ""
      : line.grams
        ? fill(dict.inCartSized, { size: formatWeight(line.grams), day })
        : fill(dict.inCart, { count: line.qty, day })

  return (
    <div className="relative z-10 flex flex-col gap-2">
      <SizeChips
        id={`${id}-sizes`}
        options={options}
        byWeight={byWeight}
        value={current}
        onPick={(value) => (line ? put(value, null) : setPicked(value))}
        title={dict.quantity}
        label={fill(dict.quantityLabel, { name: item.name })}
      />
      {line ? (
        <div className="flex flex-col items-center">
          <p className="text-center text-small text-muted">{fill(dict.forDay, { day })}</p>
          <Button variant="quiet" size="sm" onClick={remove} aria-label={fill(dict.removeLabel, { name: item.name })}>
            <Icon name="close" className="size-3.5" strokeWidth={2.4} />
            {dict.remove}
          </Button>
        </div>
      ) : (
        <Button
          id={`${id}-add`}
          variant="outlineLink"
          aria-label={fill(dict.addLabel, { name: item.name, day })}
          className="w-full font-semibold"
          onClick={() => put(picked, "size")}
        >
          {dict.add}
        </Button>
      )}
      <span role="status" className="sr-only">
        {status}
      </span>
    </div>
  )
}
