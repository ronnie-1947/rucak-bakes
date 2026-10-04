import type { TagTone } from "@/components/ui/Tag"
import { formatClock } from "@/lib/calendar/cutoffs"
import type { IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import { FEW_LEFT, type StoreDay } from "@/lib/storefront/types"
import { relativeDay, type DayWords } from "@/lib/storefront/words"
import { fill } from "@/lib/template"

type StripCopy = Dict["landing"]["dayStrip"]

export type DayPill = { text: string; tone: TagTone }

const pillTones: Record<Exclude<StoreDay["status"], "open">, TagTone> = {
  full: "red",
  paused: "red",
  cutoff: "quiet",
  closed: "quiet",
  unplanned: "quiet",
}

/** Available (green), Selling fast (warm, the last few order slots), or what stops the day. */
export function dayPill(day: StoreDay, dict: StripCopy): DayPill {
  if (day.status === "open") return day.left <= FEW_LEFT ? { text: dict.status.few, tone: "warm" } : { text: dict.status.open, tone: "green" }
  return { text: dict.status[day.status], tone: pillTones[day.status] }
}

/** The line under the bar: the order slots left and when ordering closes, or why the day isn't taking orders. */
export function dayLine(day: StoreDay, today: IsoDate, dict: StripCopy, words: DayWords): string {
  const name = relativeDay(day.date, today, words)
  const cutoff = day.cutoff ? { time: formatClock(day.cutoff.time), when: relativeDay(day.cutoff.date, today, words) } : { time: "", when: "" }
  switch (day.status) {
    case "open":
      return fill(day.left === 1 ? dict.leftOne : dict.left, { count: day.left, ...cutoff })
    case "cutoff":
      return fill(dict.cutoff, { day: name, ...cutoff })
    case "full":
      return fill(dict.full, { day: name })
    case "closed":
      return fill(dict.closed, { day: name })
    case "unplanned":
      return fill(dict.unplanned, { day: name })
    case "paused":
      return dict.paused
  }
}
