import type { TagTone } from "@/components/ui/Tag"
import { formatClock } from "@/lib/calendar/cutoffs"
import type { IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import type { FreshToday } from "@/lib/storefront/types"
import { relativeDay } from "@/lib/storefront/words"
import { fill } from "@/lib/template"

/** Fresh today's words, filled. */

type FreshCopy = Dict["landing"]["freshToday"]

const tones: Record<FreshToday["state"], TagTone> = {
  on: "green",
  soldOut: "red",
  none: "quiet",
  closed: "quiet",
}

/** "On the counter till 4pm" (green), "All sold out" (red), "Orders only today", "Closed today". */
export function freshPill(fresh: FreshToday, dict: FreshCopy): { text: string; tone: TagTone } {
  const p = dict.pill
  const text =
    fresh.state === "on" ? (fresh.closes ? fill(p.on, { time: formatClock(fresh.closes) }) : p.onAllDay) : p[fresh.state]
  return { text, tone: tones[fresh.state] }
}

/** Beside the Call button while there are counter-items: how to get them, or that they're gone. */
export function freshLine(fresh: FreshToday, hasPhone: boolean, dict: FreshCopy): string {
  if (fresh.state === "soldOut") return dict.soldOut
  if (hasPhone) return dict.walkIn
  return fresh.closes ? fill(dict.walkInUntil, { time: formatClock(fresh.closes) }) : dict.walkInOnly
}

/** The sunken message on a day with nothing on the counter: orders only, or closed — and when it's back. */
export function freshMessage(fresh: FreshToday, today: IsoDate, dict: FreshCopy, days: Dict["store"]["days"]): string {
  if (fresh.state !== "closed") return dict.none
  return fresh.back ? fill(dict.closed, { day: relativeDay(fresh.back, today, days) }) : dict.closedNoBack
}
