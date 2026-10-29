"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Container } from "@/components/ui/Container"
import { Icon } from "@/components/ui/icons/Icon"
import { usePageTitleState } from "@/hooks/usePageTitle"
import type { StoreSocial } from "@/lib/storefront/types"
import type { HeaderCall } from "./call"
import { fill } from "@/lib/template"
import { CartButton } from "./CartButton"
import { ContactLinks } from "./ContactLinks"
import type { StoreCopy } from "./copy"

type PageBarProps = {
  bakeryName: string
  /** An earlier page of this visit is behind this one in the history — Back steps to it instead of opening the menu. */
  canGoBack: boolean
  /** Off on /cart — the page is the cart. A 44px space keeps the row balanced. */
  showCart: boolean
  /** The header's Call square, or null without a public phone. */
  call: HeaderCall | null
  social: StoreSocial
  dict: StoreCopy["shell"]
}

const titles: Record<"shown" | "hidden", string> = {
  shown: "translate-y-0 opacity-100",
  hidden: "translate-y-1 opacity-0",
}

// Once the page's title is in the bar, a phone's bar keeps the logo and gives the name's room to the title.
const names: Record<"shown" | "hidden", string> = {
  shown: "hidden md:block",
  hidden: "block",
}

/**
 * Every other customer screen's header row: Back, the logo and bakery's name (home link), the page's name once
 * its own heading has scrolled away (hooks/usePageTitle), Call / Instagram / Facebook from 768px (a phone's row has
 * no room for them beside the title — the item page has its own Call), and the cart. Back is a link to the menu, so it works
 * before hydration and after a direct visit; within a visit it goes back instead, which keeps the menu's scroll
 * position. A page with steps of its own (the cart) can take Back over with usePageBack.
 */
export function PageBar({ bakeryName, canGoBack, showCart, call, social, dict }: PageBarProps) {
  const { title, back } = usePageTitleState()
  const router = useRouter()
  const titleState = title?.shown ? "shown" : "hidden"
  return (
    <Container className="flex items-center gap-2 py-2">
      <Link
        href="/"
        aria-label={dict.back}
        onClick={(event) => {
          if (back) {
            event.preventDefault()
            back()
            return
          }
          if (!canGoBack) return
          event.preventDefault()
          router.back()
        }}
        className="grid size-11 shrink-0 place-items-center rounded-button text-foreground hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700"
      >
        <Icon name="chevronLeft" className="size-5.5" />
      </Link>
      <Link
        href="/"
        aria-label={fill(dict.home, { name: bakeryName })}
        className="flex h-11 min-w-0 shrink items-center gap-2 rounded-button text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700"
      >
        <Image src="/logo.png" alt="" width={34} height={32} className="h-8 w-auto shrink-0" />
        <span className={`truncate font-display text-h2 font-semibold ${names[titleState]}`}>{bakeryName}</span>
      </Link>
      {/* The page's own h1 is the heading; this repeats it for sighted users only. */}
      <span
        aria-hidden
        className={`min-w-0 flex-1 truncate text-center font-display text-h2 font-semibold transition duration-150 ease-out motion-reduce:transition-none ${titles[titleState]}`}
      >
        {title?.text}
      </span>
      <ContactLinks call={call} social={social} dict={dict} className="hidden md:flex" />
      {showCart ? <CartButton dict={dict} /> : <span aria-hidden className="size-11 shrink-0" />}
    </Container>
  )
}
