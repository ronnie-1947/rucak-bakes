import { formatClock } from "@/lib/calendar/cutoffs"
import { formatDayLabel, formatShortWeekday, type IsoDate } from "@/lib/dates"
import { type BookingWindow, FEW_ORDERS_LEFT, pastCutoff } from "@/lib/orders/deadline"
import { noticeRunOut, staffRoom } from "@/lib/orders/staff-order"
import { fill } from "@/lib/template"
import type { NewOrderCopy } from "./types"

/**
 * The When card's date chips: each day of the booking window as staff see it. Unlike the customer's strip, only a closed
 * day can't be picked — past its cutoff, too soon for a line, or full, it stays open to staff with an orange dot.
 * Client-safe, pure.
 */

/** `few` has three or fewer orders left; the word under the date says how many. */
export type DayLook = "open" | "few" | "full" | "closed"

export type DayOption = {
  date: IsoDate
  /** "Sat" over "10" over the state word. */
  weekday: string
  day: string
  look: DayLook
  /** "Open", "2 left", "Full", "Closed". */
  word: string
  /** The chip's title and the second half of its name: "Past the 6pm cutoff", "Too soon for Custom birthday cake". */
  status: string
  /** "Sat 10 Oct, Fully booked" */
  label: string
  /** Past the cutoff, full, or too soon for a line — staff can still book it. */
  dot: boolean
}

/** The chip's title — the first reason staff should know, else how much room is left. */
function statusOf(
  chip: { look: DayLook; room: number; past: boolean; soon: string | null; cutoffTime: string },
  dict: NewOrderCopy["when"],
): string {
  const t = dict.titles
  if (chip.look === "closed") return t.closed
  if (chip.look === "full") return t.full
  if (chip.past) return fill(t.pastCutoff, { time: formatClock(chip.cutoffTime) })
  if (chip.soon) return fill(t.tooSoon, { name: chip.soon })
  if (chip.look === "few") return chip.room === 1 ? t.leftOne : fill(t.left, { count: chip.room })
  return t.open
}

export function dayOptions(window: BookingWindow, notices: { name: string; noticeDays: number }[], dict: NewOrderCopy["when"]): DayOption[] {
  return window.days.map((day) => {
    const room = staffRoom(day)
    const look: DayLook = !day.isOpen ? "closed" : room <= 0 ? "full" : room <= FEW_ORDERS_LEFT ? "few" : "open"
    const past = pastCutoff(day, window.now)
    const soon = notices.find((line) => noticeRunOut(day, line.noticeDays, window)) ?? null
    const status = statusOf({ look, room, past, soon: soon?.name ?? null, cutoffTime: day.cutoffTime }, dict)
    return {
      date: day.date,
      weekday: formatShortWeekday(day.date),
      day: String(Number(day.date.slice(8, 10))),
      look,
      word: look === "few" ? fill(dict.states.left, { count: room }) : dict.states[look],
      status,
      label: fill(dict.chipLabel, { date: formatDayLabel(day.date), status }),
      dot: look !== "closed" && (past || look === "full" || soon !== null),
    }
  })
}
