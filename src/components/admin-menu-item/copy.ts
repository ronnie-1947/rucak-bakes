import { formatClock } from "@/lib/calendar/cutoffs"
import { addDays, formatLongDayLabel, formatShortDate, formatWeekday, type IsoDate, weekday } from "@/lib/dates"
import { type ChangeKey, NOTICE } from "@/lib/menu/form"
import type { NoticeRules } from "@/lib/menu/item"
import { fill } from "@/lib/template"
import type { ItemCopy } from "./types"
import type { Problem } from "./useItemForm"

type ErrorCode = keyof ItemCopy["errors"]

/** "Basics — enter a name" — the error summary's line. */
export function problemText(problem: Problem, dict: ItemCopy): string {
  return fill(dict.errors[problem.code as ErrorCode] ?? problem.code, problem.values ?? {})
}

/** "Enter a name" — the same message under its field, without the section prefix. */
export function inlineError(code: string | undefined, dict: ItemCopy, values: Record<string, string | number> = {}): string | undefined {
  if (!code) return undefined
  const text = fill(dict.errors[code as ErrorCode] ?? code, values).replace(/^[^—]+— /, "")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "Name, Base price, Photos" */
export function changesText(changes: ChangeKey[], dict: ItemCopy): string {
  return changes.map((key) => dict.fields[key]).join(", ")
}

/** "1 day", "3 days" — the notice stepper's value. */
export function noticeValue(days: number, dict: ItemCopy["ordering"]): string {
  return days === 1 ? dict.day : fill(dict.days, { count: days })
}

const SATURDAY = 6

/** The first Saturday on or after `date`. */
function saturdayFrom(date: IsoDate): IsoDate {
  return addDays(date, (SATURDAY - weekday(date) + 7) % 7)
}

/**
 * What a notice means for a Saturday pickup, from the default cutoff (orders/deadline.ts: the cutoff time on D − max(the
 * day's days before, the notice)) — "Order by Friday 6pm for a Saturday pickup". At the longest notice the weekday alone
 * would be the pickup's own, so it names the dates of the first Saturday a customer could pick.
 */
export function noticeHelp(days: number, rules: NoticeRules, dict: ItemCopy["ordering"]): string {
  if (days === 0) return dict.sameDay
  const time = formatClock(rules.cutoffTime)
  const longest = days >= NOTICE.max
  const saturday = saturdayFrom(longest ? addDays(rules.today, NOTICE.max) : rules.today)
  const deadline = addDays(saturday, -Math.max(rules.cutoffDaysBefore, days))
  return longest
    ? fill(dict.orderByDate, { date: formatShortDate(saturday), deadline: formatLongDayLabel(deadline), time })
    : fill(dict.orderBy, { weekday: formatWeekday(deadline), time })
}
