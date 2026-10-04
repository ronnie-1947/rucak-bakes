"use client"

import { usePathname } from "next/navigation"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { useCart } from "@/hooks/useCart"
import { formatPaise } from "@/lib/money"
import { itemsText, type StoreCopy } from "./copy"

type CartBarProps = {
  dict: StoreCopy["shell"]
}

/**
 * "View cart", only while the cart has something — never on /cart itself, nor on an item page, which has its
 * own bottom bar (Add to cart, then View cart). Phones get a bar pinned to the bottom edge (count and total
 * over a 48px button, clear of the home indicator); from 768px a floating pill in the corner. A spacer in the
 * flow keeps the page's last lines from hiding under either.
 */
export function CartBar({ dict }: CartBarProps) {
  const { count, subtotalPaise } = useCart()
  const pathname = usePathname()
  if (count === 0 || pathname === "/cart" || pathname.startsWith("/menu/")) return null

  const items = itemsText(count, dict)
  const total = formatPaise(subtotalPaise)
  return (
    <>
      <div aria-hidden className="h-32 shrink-0 md:h-24" />
      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-3 border-t border-border bg-background px-4 pt-4 pb-safe-lg shadow-raised md:hidden print:hidden">
        <div className="flex items-center justify-between text-small tabular-nums">
          <span className="text-muted">{items}</span>
          <span className="font-semibold">{total}</span>
        </div>
        <ButtonLink href="/cart" size="lg" className="w-full font-semibold">
          {dict.viewCart}
        </ButtonLink>
      </div>
      <div className="fixed right-6 bottom-6 z-20 hidden md:block lg:right-8 lg:bottom-8 print:hidden">
        <ButtonLink href="/cart" size="lg" shape="pill" aria-label={`${dict.viewCart}, ${items}, ${total}`} className="gap-3 font-semibold">
          <span aria-hidden className="grid h-6 min-w-6 place-items-center rounded-pill bg-background px-1.5 text-small text-o700 tabular-nums">
            {count}
          </span>
          <span aria-hidden>{dict.viewCart}</span>
          <span aria-hidden className="tabular-nums opacity-90">
            {total}
          </span>
        </ButtonLink>
      </div>
    </>
  )
}
