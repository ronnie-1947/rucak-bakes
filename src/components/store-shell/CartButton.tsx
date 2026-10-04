"use client"

import Link from "next/link"
import { Icon } from "@/components/ui/icons/Icon"
import { useCart } from "@/hooks/useCart"
import { cartLabel, type StoreCopy } from "./copy"

type CartButtonProps = {
  dict: StoreCopy["shell"]
}

/** The header's 44px cart square, with the unit count on an o700 badge once the cart has anything. */
export function CartButton({ dict }: CartButtonProps) {
  const { count } = useCart()
  return (
    <Link
      href="/cart"
      aria-label={cartLabel(count, dict)}
      className="relative grid size-11 shrink-0 place-items-center rounded-button border border-border bg-background text-foreground hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700"
    >
      <Icon name="cart" className="size-5" strokeWidth={1.8} />
      {count > 0 ? (
        <span
          aria-hidden
          className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-pill border-2 border-background bg-o700 px-1.5 text-micro font-semibold text-background tabular-nums"
        >
          {count}
        </span>
      ) : null}
    </Link>
  )
}
