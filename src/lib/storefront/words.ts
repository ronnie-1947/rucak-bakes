import { addDays, formatWeekday, type IsoDate } from "@/lib/dates"

/** How customer screens name a day relative to today. Client-safe. */

export type DayWords = { yesterday: string; today: string; tomorrow: string }

/** "today", "tomorrow", "yesterday", else the weekday — "Saturday". Within a week either side, that's unambiguous. */
export function relativeDay(date: IsoDate, today: IsoDate, words: DayWords): string {
  if (date === today) return words.today
  if (date === addDays(today, 1)) return words.tomorrow
  if (date === addDays(today, -1)) return words.yesterday
  return formatWeekday(date)
}
