import { addDays, formatWeekday, type IsoDate } from "@/lib/dates"
import { fill } from "@/lib/template"

/** How customer screens name a day relative to today, and an item's notice. Client-safe. */

export type DayWords = { yesterday: string; today: string; tomorrow: string }

/** "today", "tomorrow", "yesterday", else the weekday — "Saturday". Within a week either side, that's unambiguous. */
export function relativeDay(date: IsoDate, today: IsoDate, words: DayWords): string {
  if (date === today) return words.today
  if (date === addDays(today, 1)) return words.tomorrow
  if (date === addDays(today, -1)) return words.yesterday
  return formatWeekday(date)
}

export type NoticeWords = { sameDay: string; byTomorrow: string; daysAhead: string; callOnly: string; oneDay: string; days: string }

/** A menu card's notice chip: "Same day", "Order by tomorrow", "Order 3 days ahead" — "Made to order" when it's call only. */
export function noticeChip(
  noticeDays: number,
  orderable: boolean,
  words: Pick<NoticeWords, "sameDay" | "byTomorrow" | "daysAhead" | "callOnly">,
): string {
  if (!orderable) return words.callOnly
  if (noticeDays === 0) return words.sameDay
  if (noticeDays === 1) return words.byTomorrow
  return fill(words.daysAhead, { count: noticeDays })
}

/** "1 day’s notice", "3 days’ notice" — inside a sentence. */
export function noticeLength(noticeDays: number, words: Pick<NoticeWords, "oneDay" | "days">): string {
  return noticeDays === 1 ? words.oneDay : fill(words.days, { count: noticeDays })
}
