import type { TagTone } from "@/components/ui/Tag"
import { formatClock } from "@/lib/calendar/cutoffs"
import type { Dict } from "@/lib/i18n"
import type { FreshToday } from "@/lib/storefront/types"
import { fill } from "@/lib/template"

/** Fresh today's words, filled. */

type FreshCopy = Dict["landing"]["freshToday"]

const tones: Record<FreshToday["state"], TagTone> = {
  on: "green",
  soldOut: "red",
}

/** "On the counter till 4pm" (green), "All sold out" (red). */
export function freshPill(fresh: FreshToday, dict: FreshCopy): { text: string; tone: TagTone } {
  const p = dict.pill
  const text =
    fresh.state === "on" ? (fresh.closes ? fill(p.on, { time: formatClock(fresh.closes) }) : p.onAllDay) : p[fresh.state]
  return { text, tone: tones[fresh.state] }
}

/** Above the cards: how to get them, or that they're gone. "Call" means the header's Call square. */
export function freshLine(fresh: FreshToday, hasPhone: boolean, dict: FreshCopy): string {
  if (fresh.state === "soldOut") return dict.soldOut
  if (hasPhone) return dict.walkIn
  return fresh.closes ? fill(dict.walkInUntil, { time: formatClock(fresh.closes) }) : dict.walkInOnly
}
