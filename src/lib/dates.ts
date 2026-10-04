/**
 * Calendar dates and bakery-local time.
 *
 * A fulfilment day is a calendar date with no time or zone: "2026-10-03". That string
 * is what the cart, URLs and forms carry. Instants (cutoffAt, createdAt) are UTC Dates.
 * The bakery's own timezone (Settings.timezone) converts between the two.
 */

/** "YYYY-MM-DD" */
export type IsoDate = string

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/

function parseIsoDate(date: IsoDate): [number, number, number] {
  const match = ISO_DATE.exec(date)
  if (!match) throw new RangeError(`Not a YYYY-MM-DD date: "${date}"`)
  const [, y, m, d] = match.map(Number)
  const probe = new Date(Date.UTC(y, m - 1, d))
  if (probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) throw new RangeError(`No such date: "${date}"`)
  return [y, m, d]
}

function parseTime(time: string): [number, number] {
  const match = HH_MM.exec(time)
  if (!match) throw new RangeError(`Not an HH:MM time: "${time}"`)
  return [Number(match[1]), Number(match[2])]
}

const partFormatters = new Map<string, Intl.DateTimeFormat>()

/** Wall-clock parts of an instant in a timezone. Formatters are cached — they're expensive to build. */
function wallClock(instant: Date, timeZone: string) {
  let formatter = partFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    partFormatters.set(timeZone, formatter)
  }
  const parts = Object.fromEntries(formatter.formatToParts(instant).map((part) => [part.type, part.value]))
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

/** How far `timeZone`'s wall clock is ahead of UTC at `instant`, in ms. */
function offsetMs(instant: Date, timeZone: string): number {
  const wall = wallClock(instant, timeZone)
  const wallAsUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)
  return wallAsUtc - Math.floor(instant.getTime() / 1000) * 1000
}

/** The UTC instant at which it is `time` on `date` in `timeZone`. */
export function zonedTimeToUtc(date: IsoDate, time: string, timeZone: string): Date {
  const [y, m, d] = parseIsoDate(date)
  const [hour, minute] = parseTime(time)
  const wallAsUtc = Date.UTC(y, m - 1, d, hour, minute)
  const guess = wallAsUtc - offsetMs(new Date(wallAsUtc), timeZone)
  // A second pass corrects the guess when it lands across a DST change (Asia/Kolkata has none).
  return new Date(wallAsUtc - offsetMs(new Date(guess), timeZone))
}

/** The calendar date in `timeZone` at `instant`. */
export function isoDateInZone(instant: Date, timeZone: string): IsoDate {
  const { year, month, day } = wallClock(instant, timeZone)
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function todayIn(timeZone: string, now = new Date()): IsoDate {
  return isoDateInZone(now, timeZone)
}

/** Pure calendar arithmetic — no timezone involved. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const [y, m, d] = parseIsoDate(date)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** Day of week, 0 = Sunday. */
export function weekday(date: IsoDate): number {
  const [y, m, d] = parseIsoDate(date)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** `@db.Date` columns: Prisma reads and writes them as Dates at 00:00 UTC. */
export function toDbDate(date: IsoDate): Date {
  parseIsoDate(date)
  return new Date(`${date}T00:00:00.000Z`)
}

export function fromDbDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10)
}

/**
 * When ordering closes for a fulfilment day: `daysBefore` days earlier, at `time` bakery-local.
 * The result is stored on MenuDay.cutoffAt, which is THE source of truth — recompute it whenever
 * a day is created or copied, never copy it.
 */
export function computeCutoffAt(date: IsoDate | Date, time: string, daysBefore: number, timeZone: string): Date {
  const day = typeof date === "string" ? date : fromDbDate(date)
  return zonedTimeToUtc(addDays(day, -daysBefore), time, timeZone)
}

/** A calendar day in `timeZone` as a half-open UTC range: [start, end). */
export function dayBounds(date: IsoDate, timeZone: string): { start: Date; end: Date } {
  return { start: zonedTimeToUtc(date, "00:00", timeZone), end: zonedTimeToUtc(addDays(date, 1), "00:00", timeZone) }
}

const dayLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" })
const longDayLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "short" })
const weekdayName = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long" })
const shortWeekdayName = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short" })
const shortDate = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" })

/** "Sat 3 Oct" */
export function formatDayLabel(date: IsoDate): string {
  return dayLabel.format(toDbDate(date))
}

/** "Sat 3" — inside a list where the month is already plain. */
export function formatDayNumber(date: IsoDate): string {
  return formatDayLabel(date).replace(/ \S+$/, "")
}

/** "Saturday 3 Oct" */
export function formatLongDayLabel(date: IsoDate): string {
  return longDayLabel.format(toDbDate(date))
}

/** "Saturday" */
export function formatWeekday(date: IsoDate): string {
  return weekdayName.format(toDbDate(date))
}

/** "Sat" */
export function formatShortWeekday(date: IsoDate): string {
  return shortWeekdayName.format(toDbDate(date))
}

/** "3 Oct" */
export function formatShortDate(date: IsoDate): string {
  return shortDate.format(toDbDate(date))
}

/** The Monday of the week `date` falls in — the bakery plans Monday to Sunday. */
export function weekStart(date: IsoDate): IsoDate {
  return addDays(date, -((weekday(date) + 6) % 7))
}

/** "11:02" — an instant's wall-clock time in the bakery's timezone, 24-hour. */
export function formatTimeIn(instant: Date, timeZone: string): string {
  const { hour, minute } = wallClock(instant, timeZone)
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

/** "Fri 2 Oct, 11:02" — an instant as a bakery-local day and time. */
export function formatDayTimeIn(instant: Date, timeZone: string): string {
  return `${formatDayLabel(isoDateInZone(instant, timeZone))}, ${formatTimeIn(instant, timeZone)}`
}

/** Every date from `start` to `end`, inclusive. */
export function dateRange(start: IsoDate, end: IsoDate): IsoDate[] {
  const dates: IsoDate[] = []
  for (let date = start; date <= end; date = addDays(date, 1)) dates.push(date)
  return dates
}

export function isIsoDate(value: string): value is IsoDate {
  if (!ISO_DATE.test(value)) return false
  try {
    parseIsoDate(value)
    return true
  } catch {
    return false
  }
}
