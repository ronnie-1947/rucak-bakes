import type { ItemTarget } from "@/hooks/useMenuActions"
import { daysText } from "./copy"
import type { MenuCopy } from "./types"

type ScheduleLinesProps = {
  targets: ItemTarget[]
  dict: MenuCopy["dialogs"]
}

const tones: Record<"scheduled" | "none", string> = {
  scheduled: "text-foreground",
  none: "text-muted",
}

/** Inside a confirm dialog: each item affected, and the upcoming days it's on. */
export function ScheduleLines({ targets, dict }: ScheduleLinesProps) {
  return (
    <ul className="flex flex-col">
      {targets.map((target) => (
        <li key={target.id} className="flex flex-col border-t border-border py-2">
          <span className="font-semibold">{target.name}</span>
          <span className={`text-small-admin tabular-nums ${tones[target.upcoming.length > 0 ? "scheduled" : "none"]}`}>
            {daysText(target.upcoming, dict)}
          </span>
        </li>
      ))}
    </ul>
  )
}
