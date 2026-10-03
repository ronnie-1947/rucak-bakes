"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useSettingsLeave } from "@/hooks/useSettingsLeave"

type GuardedLinkProps = {
  href: string
  className?: string
  /**
   * The open section's own list entry: it never leaves the section (on phones it opens it, from 768px it's
   * already open), so it isn't guarded — and its unsaved changes stay put.
   */
  current?: boolean
  "aria-label"?: string
  children: ReactNode
}

/** A link out of the open section — the leave dialog stops it while there are unsaved changes. */
export function GuardedLink({ href, className, current = false, "aria-label": label, children }: GuardedLinkProps) {
  const { guard } = useSettingsLeave()
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      onClick={current ? undefined : (event) => guard(event, href)}
      className={className}
    >
      {children}
    </Link>
  )
}
