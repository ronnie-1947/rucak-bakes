"use client"

import Link from "next/link"
import { Container } from "@/components/ui/Container"
import { useScrolled } from "@/hooks/useScrolled"
import { fill } from "@/lib/template"
import { CartButton } from "./CartButton"
import type { StoreCopy } from "./copy"

type HomeBarProps = {
  bakeryName: string
  /** First line of the pickup address, or null to leave the line out. */
  place: string | null
  dict: StoreCopy["shell"]
}

const sizes: Record<"full" | "condensed", string> = {
  full: "py-3 md:py-4",
  condensed: "py-2",
}

const names: Record<"full" | "condensed", string> = {
  full: "text-h1",
  condensed: "text-h2",
}

/**
 * The landing page's header row: the bakery's name (home link), "Pickup at …" and the cart. Once the page
 * scrolls it condenses — smaller name, no address line — to give a phone its height back.
 */
export function HomeBar({ bakeryName, place, dict }: HomeBarProps) {
  const state = useScrolled() ? "condensed" : "full"
  return (
    <Container className={`flex items-center justify-between gap-4 ${sizes[state]}`}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link
          href="/"
          aria-label={fill(dict.home, { name: bakeryName })}
          className={`truncate font-display font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-o700 ${names[state]}`}
        >
          {bakeryName}
        </Link>
        {place && state === "full" ? <span className="truncate text-small text-muted">{fill(dict.pickupAt, { place })}</span> : null}
      </div>
      <CartButton dict={dict} />
    </Container>
  )
}
