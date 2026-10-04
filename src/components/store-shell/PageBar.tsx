"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Container } from "@/components/ui/Container"
import { Icon } from "@/components/ui/icons/Icon"
import { usePageTitleState } from "@/hooks/usePageTitle"
import { CartButton } from "./CartButton"
import type { StoreCopy } from "./copy"

type PageBarProps = {
  /** An earlier page of this visit is behind this one in the history — Back steps to it instead of opening the menu. */
  canGoBack: boolean
  /** Off on /cart — the page is the cart. A 44px space keeps the title centred. */
  showCart: boolean
  dict: StoreCopy["shell"]
}

const titles: Record<"shown" | "hidden", string> = {
  shown: "translate-y-0 opacity-100",
  hidden: "translate-y-1 opacity-0",
}

/**
 * Every other customer screen's header row: Back, the page's name once its own heading has scrolled away
 * (hooks/usePageTitle), and the cart. Back is a link to the menu, so it works before hydration and after a
 * direct visit; within a visit it goes back instead, which keeps the menu's scroll position. A page with steps of
 * its own (the cart) can take Back over with usePageBack.
 */
export function PageBar({ canGoBack, showCart, dict }: PageBarProps) {
  const { title, back } = usePageTitleState()
  const router = useRouter()
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
      {/* The page's own h1 is the heading; this repeats it for sighted users only. */}
      <span
        aria-hidden
        className={`min-w-0 flex-1 truncate text-center font-display text-h2 font-semibold transition duration-150 ease-out motion-reduce:transition-none ${titles[title?.shown ? "shown" : "hidden"]}`}
      >
        {title?.text}
      </span>
      {showCart ? <CartButton dict={dict} /> : <span aria-hidden className="size-11 shrink-0" />}
    </Container>
  )
}
