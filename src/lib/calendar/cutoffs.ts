import type { Dict } from "@/lib/i18n"
import { fill } from "@/lib/template"

/**
 * When ordering closes for a day, as the owner chooses it: a wall-clock time, some days before. Stored on
 * MenuDay as `cutoffTime` + `cutoffDaysBefore` (display) and turned into `cutoffAt` (the truth) on every
 * write — see computeCutoffAt. Client-safe.
 */
export type CutoffChoice = { time: string; daysBefore: number }

/** The choices the planner offers. A day saved with anything else keeps it as an extra option. */
export const CUTOFF_CHOICES: readonly CutoffChoice[] = [
  { time: "16:00", daysBefore: 1 },
  { time: "18:00", daysBefore: 1 },
  { time: "20:00", daysBefore: 1 },
  { time: "09:00", daysBefore: 0 },
  { time: "11:00", daysBefore: 0 },
]

/** "1@18:00" — a choice as a <select> value. */
export function cutoffKey(choice: CutoffChoice): string {
  return `${choice.daysBefore}@${choice.time}`
}

const KEY = /^([0-7])@([01]\d|2[0-3]):([0-5]\d)$/

export function parseCutoffKey(key: string): CutoffChoice | null {
  const match = KEY.exec(key)
  return match ? { daysBefore: Number(match[1]), time: `${match[2]}:${match[3]}` } : null
}

export function sameCutoff(a: CutoffChoice, b: CutoffChoice): boolean {
  return a.time === b.time && a.daysBefore === b.daysBefore
}

/** Earliest close first: more days before, then the earlier time. */
function byLeadTime(a: CutoffChoice, b: CutoffChoice): number {
  return b.daysBefore - a.daysBefore || a.time.localeCompare(b.time)
}

/** The offered choices, plus the ones already in use when they aren't among them. */
export function cutoffOptions(inUse: CutoffChoice[] = []): CutoffChoice[] {
  const extra = inUse.filter((choice, index) => !CUTOFF_CHOICES.some((c) => sameCutoff(c, choice)) && inUse.findIndex((c) => sameCutoff(c, choice)) === index)
  return [...CUTOFF_CHOICES, ...extra].sort(byLeadTime)
}

/** "18:00" → "6pm", "09:30" → "9:30am", "00:00" → "12am". */
export function formatClock(time: string): string {
  const [hour, minute] = time.split(":").map(Number)
  const twelve = hour % 12 === 0 ? 12 : hour % 12
  return `${twelve}${minute ? `:${String(minute).padStart(2, "0")}` : ""}${hour < 12 ? "am" : "pm"}`
}

type CutoffCopy = Dict["admin"]["cutoffs"]

/** "6pm the day before" (long) or "6pm prev day" (short, for the week's narrow columns). */
export function cutoffLabel(choice: CutoffChoice, dict: CutoffCopy, length: "long" | "short"): string {
  const forms = dict[length]
  const template = choice.daysBefore === 0 ? forms.sameDay : choice.daysBefore === 1 ? forms.dayBefore : forms.daysBefore
  return fill(template, { time: formatClock(choice.time), count: choice.daysBefore })
}
