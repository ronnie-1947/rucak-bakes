"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { IconName } from "@/components/ui/icons/Icon"
import { type NavVariant, sidebarRow } from "./nav"
import { NavIcon } from "./NavIcon"

type NavLinkProps = {
  href: string
  label: string
  icon: IconName
  /** Path prefixes that make this link the current page. */
  match: string[]
  variant: NavVariant
  /** The pending-order count on Orders. Hidden at 0. */
  badge?: number
  /** Accessible text for the badge ("3 pending orders"). */
  badgeLabel?: string
}

const shells: Record<NavVariant, string> = {
  sidebar: `${sidebarRow} text-body-admin`,
  tab: "relative flex min-h-12 flex-col items-center justify-center gap-1 text-micro",
}

const states: Record<NavVariant, Record<"on" | "off", string>> = {
  sidebar: {
    on: "bg-background/10 font-semibold text-background",
    off: "font-medium text-subtle hover:bg-background/10 hover:text-background",
  },
  tab: {
    on: "font-semibold text-o700",
    off: "font-medium text-muted",
  },
}

const badges: Record<NavVariant, string> = {
  sidebar: "ml-auto",
  tab: "absolute top-1 left-1/2 ml-1",
}

/** Needs the pathname for the active state — the only reason the shell has a client leaf. */
export function NavLink({ href, label, icon, match, variant, badge, badgeLabel }: NavLinkProps) {
  const pathname = usePathname()
  const active = match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`${shells[variant]} ${states[variant][active ? "on" : "off"]}`}>
      {variant === "sidebar" && active ? <span aria-hidden className="absolute top-2 bottom-2 left-0 w-1 rounded-pill bg-o500" /> : null}
      <NavIcon icon={icon} variant={variant} />
      <span className={variant === "sidebar" ? "flex-1" : undefined}>{label}</span>
      {badge ? (
        <span
          aria-label={badgeLabel}
          className={`flex h-5 min-w-5 items-center justify-center rounded-pill bg-o700 px-1 text-micro font-semibold text-background ${badges[variant]}`}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  )
}
