"use client"

import type { ReactNode } from "react"
import { usePageTitle } from "@/hooks/usePageTitle"

type CartHeadingProps = {
  id: string
  /** "Your order", "Your details", "Order sent" — the step's name, also handed to the store header. */
  title: string
  /** Right of the heading — Clear on the cart step. */
  action?: ReactNode
}

/** The step's h1. It takes focus when the step changes (tabIndex −1), and fades into the header once scrolled away. */
export function CartHeading({ id, title, action }: CartHeadingProps) {
  usePageTitle(title, id)
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <h1 id={id} tabIndex={-1} className="text-h1 text-balance outline-none">
        {title}
      </h1>
      {action}
    </div>
  )
}
