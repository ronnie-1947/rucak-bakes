"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { useCart } from "@/hooks/useCart";
import { type AddTarget, MAX_LINE_QTY } from "@/lib/cart/cart";
import type { IsoDate } from "@/lib/dates";
import type { StoreItem } from "@/lib/storefront/types";
import { relativeDay } from "@/lib/storefront/words";
import { fill } from "@/lib/template";
import type { AddCopy } from "./card";

type AddToCartProps = {
  item: StoreItem;
  /** The dates the item can be ordered for, earliest first — never empty. */
  dates: IsoDate[];
  today: IsoDate;
  dict: AddCopy;
};

/**
 * Add to cart straight from a card: one, for the cart's day when the item can be had then (no "Switch to …?"), else for
 * the earliest date it can — CartProvider asks first when that clears another day's cart. Once it's in, the button becomes
 * a stepper bound to the cart (0 takes it out) with "For tomorrow" under it, and focus follows the swap. The cart page can
 * still move the day. Sits above the card's stretched link.
 */
export function AddToCart({ item, dates, today, dict }: AddToCartProps) {
  const { cart, quantityOf, setQuantity } = useCart();
  const id = useId();
  // The status line speaks only after a tap here — not when the stored cart is read on load.
  const [touched, setTouched] = useState(false);
  const focusNext = useRef<"add" | "qty" | null>(null);
  const date =
    cart && dates.includes(cart.fulfilmentDate)
      ? cart.fulfilmentDate
      : dates[0];
  const inCart = quantityOf(item.id, date);
  const day = relativeDay(date, today, dict.days);

  // Add and the stepper swap places: move focus to whichever has just appeared, once it has.
  useEffect(() => {
    const next = focusNext.current;
    if (next === null || (next === "qty") !== inCart > 0) return;
    focusNext.current = null;
    document.getElementById(`${id}-${next}`)?.focus();
  }, [inCart, id]);

  const target: AddTarget = {
    menuItemId: item.id,
    slug: item.slug,
    name: item.name,
    pricePaise: item.pricePaise,
    imageId: item.image,
    date,
    max: MAX_LINE_QTY,
    noticeDays: item.noticeDays,
  };
  const change = (qty: number, focus: "add" | "qty" | null) => {
    focusNext.current = focus;
    setTouched(true);
    setQuantity(target, qty);
  };

  return (
    <div className="relative z-10 flex flex-col gap-1">
      {inCart > 0 ? (
        <>
          <p className="text-center text-small text-muted">
            {fill(dict.forDay, { day })}
          </p>
          <Stepper
            id={`${id}-qty`}
            value={inCart}
            min={0}
            max={MAX_LINE_QTY}
            width="full"
            onChange={(value) => change(value, value === 0 ? "add" : null)}
            decreaseLabel={fill(dict.decrease, { name: item.name })}
            increaseLabel={fill(dict.increase, { name: item.name })}
          />
        </>
      ) : (
        <Button
          id={`${id}-add`}
          variant="outlineLink"
          aria-label={fill(dict.addLabel, { name: item.name, day })}
          className="w-full font-semibold"
          onClick={() => change(1, "qty")}
        >
          {dict.add}
        </Button>
      )}
      <span role="status" className="sr-only">
        {touched && inCart > 0 ? fill(dict.inCart, { count: inCart, day }) : ""}
      </span>
    </div>
  );
}
