"use client"

import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { Stepper } from "@/components/ui/Stepper"
import { useCart } from "@/hooks/useCart"
import type { Dict } from "@/lib/i18n"
import { fill } from "@/lib/template"
import type { Offer } from "./offer"

type AddToCartProps = {
  name: string
  offer: Offer
  /** Only the control's own strings — this is a client component. */
  dict: Pick<Dict["store"]["item"], "add" | "addLabel" | "decrease" | "increase">
}

/**
 * "+ Add", which becomes − qty + once the item is in the cart for that day (down to 0 takes it out, up to what
 * the day has left). Disabled with the reason underneath when the day or item can't take an order. Adding for
 * a different day than the cart's asks first — CartProvider's dialog.
 */
export function AddToCart({ name, offer, dict }: AddToCartProps) {
  const { quantityOf, setQuantity } = useCart()
  const { target } = offer
  const qty = target ? quantityOf(target.menuItemId, target.date) : 0
  const note = offer.reason ?? offer.hint

  return (
    <div className="relative z-10 flex flex-col gap-1">
      <div className="flex min-h-12 items-center">
        {target && qty > 0 ? (
          <Stepper
            value={qty}
            min={0}
            max={target.max}
            onChange={(value) => setQuantity(target, value)}
            decreaseLabel={fill(dict.decrease, { name })}
            increaseLabel={fill(dict.increase, { name })}
            width="full"
          />
        ) : (
          <Button
            variant="outlineLink"
            size="lg"
            disabled={!target}
            aria-label={fill(dict.addLabel, { name })}
            onClick={() => target && setQuantity(target, 1)}
            className="w-full px-4"
          >
            <Icon name="plus" className="size-4" />
            {dict.add}
          </Button>
        )}
      </div>
      {note ? <span className="text-micro text-pretty text-muted">{note}</span> : null}
    </div>
  )
}
