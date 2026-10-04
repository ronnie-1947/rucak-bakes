import { formatClock } from "@/lib/calendar/cutoffs"
import type { Dict } from "@/lib/i18n"
import { hoursRuns, type OpeningHours } from "@/lib/settings/hours"
import { fill } from "@/lib/template"

type VisitCopy = Dict["landing"]["visitUs"]

/** ["Mon–Sat, 8am–8pm", "Sun closed"] — consecutive days with the same hours folded together. */
export function hoursLines(hours: OpeningHours, dict: VisitCopy): string[] {
  return hoursRuns(hours).map((run) => {
    const days = run.first === run.last ? dict.days[run.first] : fill(dict.range, { first: dict.days[run.first], last: dict.days[run.last] })
    return run.hours.open ? fill(dict.open, { days, from: formatClock(run.hours.from), to: formatClock(run.hours.to) }) : fill(dict.closed, { days })
  })
}

/** A Maps search for the address — opens the app on a phone. No key, no embed. */
export function mapHref(address: string[]): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.join(", "))}`
}
