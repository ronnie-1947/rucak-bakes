import Link from "next/link"
import type { SheetView } from "@/lib/daysheet/routes"
import { fill } from "@/lib/template"
import type { DaySheetCopy } from "./types"

type ViewTabsProps = {
  view: SheetView
  hrefs: Record<SheetView, string>
  /** Verified orders — the Pickups tab's count. */
  pickupCount: number
  dict: DaySheetCopy
}

const tabs: Record<"on" | "off", string> = {
  on: "bg-o500 font-semibold text-foreground",
  off: "font-medium text-foreground hover:bg-sunken",
}

/** Bake | Pickups · 6 — the baker's view and the counter's. Links, so the tab survives a refresh. */
export function ViewTabs({ view, hrefs, pickupCount, dict }: ViewTabsProps) {
  const labels: Record<SheetView, string> = { bake: dict.bake, pickups: fill(dict.pickups, { count: pickupCount }) }

  return (
    <nav aria-label={dict.tabsLabel} className="grid h-12 w-full grid-cols-2 gap-0.5 rounded-button border border-border p-0.5 md:max-w-120">
      {(["bake", "pickups"] as const).map((key) => (
        <Link
          key={key}
          href={hrefs[key]}
          scroll={false}
          aria-current={view === key ? "page" : undefined}
          className={`grid place-items-center rounded-chip tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${tabs[view === key ? "on" : "off"]}`}
        >
          {labels[key]}
        </Link>
      ))}
    </nav>
  )
}
