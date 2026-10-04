"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"
import type { StoreCopy } from "./copy"
import { HomeBar } from "./HomeBar"
import { PageBar } from "./PageBar"

type StoreHeaderProps = {
  bakeryName: string
  /** First line of the pickup address, or null to leave the line out. */
  place: string | null
  dict: StoreCopy["shell"]
}

/**
 * The sticky top bar of every customer screen. The landing page gets the bakery's name and pickup line
 * (HomeBar); every other screen gets Back, its own name and the cart (PageBar), as the item and cart designs
 * draw it. Client for the path, and so it can remember where this visit started.
 */
export function StoreHeader({ bakeryName, place, dict }: StoreHeaderProps) {
  const pathname = usePathname()
  // The page this visit opened on. Stepping back from it would leave the site, so only later pages go back.
  const [entry] = useState(pathname)
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background shadow-raised print:hidden">
      {pathname === "/" ? (
        <HomeBar bakeryName={bakeryName} place={place} dict={dict} />
      ) : (
        <PageBar canGoBack={pathname !== entry} showCart={pathname !== "/cart"} dict={dict} />
      )}
    </header>
  )
}
