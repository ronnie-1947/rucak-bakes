"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"
import type { StoreSocial } from "@/lib/storefront/types"
import type { HeaderCall } from "./call"
import type { StoreCopy } from "./copy"
import { HomeBar } from "./HomeBar"
import { PageBar } from "./PageBar"

type StoreHeaderProps = {
  bakeryName: string
  /** First line of the pickup address, or null to leave the line out. */
  place: string | null
  /** The header's Call square, or null without a public phone. */
  call: HeaderCall | null
  social: StoreSocial
  dict: StoreCopy["shell"]
}

/**
 * The sticky top bar of every customer screen. The landing page gets the logo, the bakery's name and pickup line,
 * Call / Instagram / Facebook and the cart (HomeBar); every other screen gets Back, the logo and name, its own title,
 * the contact squares from 768px and the cart (PageBar). Client for the
 * path, and so it can remember where this visit started.
 */
export function StoreHeader({ bakeryName, place, call, social, dict }: StoreHeaderProps) {
  const pathname = usePathname()
  // The page this visit opened on. Stepping back from it would leave the site, so only later pages go back.
  const [entry] = useState(pathname)
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background shadow-raised print:hidden">
      {pathname === "/" ? (
        <HomeBar bakeryName={bakeryName} place={place} call={call} social={social} dict={dict} />
      ) : (
        <PageBar
          bakeryName={bakeryName}
          canGoBack={pathname !== entry}
          showCart={pathname !== "/cart"}
          call={call}
          social={social}
          dict={dict}
        />
      )}
    </header>
  )
}
