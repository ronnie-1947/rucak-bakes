import Link from "next/link"
import { Icon } from "@/components/ui/icons/Icon"
import { type MenuFilters, menuHref, viewChoices, type ViewChoice } from "@/lib/menu/filters"
import type { MenuCopy } from "./types"

type ViewToggleProps = {
  filters: MenuFilters
  /** The view shown as pressed — with no ?view= the caller renders one toggle per breakpoint. */
  current: ViewChoice
  dict: MenuCopy
  /** Sets the display — "flex", or "flex md:hidden" / "hidden md:flex" for the per-breakpoint pair. */
  className: string
}

const segments: Record<"on" | "off", string> = {
  on: "bg-o500 font-semibold",
  off: "font-medium hover:bg-sunken",
}

/** List / Grid, as two links in one segmented control. The pressed one is the warm fill with ink text. */
export function ViewToggle({ filters, current, dict, className }: ViewToggleProps) {
  return (
    <div role="group" aria-label={dict.viewLabel} className={`h-11 shrink-0 gap-1 rounded-button border border-border p-1 ${className}`}>
      {viewChoices.map((view) => (
        <Link
          key={view}
          href={menuHref({ ...filters, view })}
          scroll={false}
          aria-current={view === current ? "true" : undefined}
          className={`flex h-full items-center gap-2 rounded-chip px-3 text-small-admin text-foreground focus-visible:outline-2 focus-visible:outline-o700 ${segments[view === current ? "on" : "off"]}`}
        >
          <Icon name={view} className="size-4" />
          <span>{dict.views[view]}</span>
        </Link>
      ))}
    </div>
  )
}
