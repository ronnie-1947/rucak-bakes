"use client"

import Image from "next/image"
import Link from "next/link"
import { Container } from "@/components/ui/Container"
import { useScrolled } from "@/hooks/useScrolled"
import type { StoreSocial } from "@/lib/storefront/types"
import type { HeaderCall } from "./call"
import { fill } from "@/lib/template"
import { CartButton } from "./CartButton"
import { ContactLinks } from "./ContactLinks"
import type { StoreCopy } from "./copy"

type HomeBarProps = {
  bakeryName: string
  /** First line of the pickup address, or null to leave the line out. */
  place: string | null
  /** The header's Call square, or null without a public phone. */
  call: HeaderCall | null
  social: StoreSocial
  dict: StoreCopy["shell"]
}

const sizes: Record<"full" | "condensed", string> = {
  full: "py-3 md:py-4",
  condensed: "py-2",
}

// Below 480px the name drops a size: four 44px squares share the row with it.
const names: Record<"full" | "condensed", string> = {
  full: "text-h2 xs:text-h1",
  condensed: "text-h2",
}

const logos: Record<"full" | "condensed", string> = {
  full: "h-11",
  condensed: "h-8",
}

/**
 * The landing page's header row: the logo, the bakery's name (home link), "Pickup at …", then Call, Instagram,
 * Facebook and the cart. Once the page scrolls it condenses — smaller logo and name, no address line — to give a
 * phone its height back. Below 480px the logo steps aside so the name fits beside the four squares.
 */
export function HomeBar({ bakeryName, place, call, social, dict }: HomeBarProps) {
  const state = useScrolled() ? "condensed" : "full"
  return (
    <Container className={`flex items-center justify-between gap-2 xs:gap-4 ${sizes[state]}`}>
      <div className="flex min-w-0 items-center gap-3">
        {/* A second way home for the pointer only — the name is the link keyboards and screen readers get. */}
        <Link href="/" tabIndex={-1} aria-hidden className="hidden shrink-0 xs:block">
          <Image src="/logo.png" alt="" width={47} height={44} className={`w-auto ${logos[state]}`} />
        </Link>
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
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ContactLinks call={call} social={social} dict={dict} />
        <CartButton dict={dict} />
      </div>
    </Container>
  )
}
