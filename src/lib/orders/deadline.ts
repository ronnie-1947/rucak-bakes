import { computeCutoffAt, type IsoDate } from "@/lib/dates"

/**
 * The deadline rule — dev-docs/implementation.md §10R. Every customer screen, the staff screens and placeOrder judge a pickup
 * date with these functions, so they can never disagree. Client-safe and pure: instants are epoch ms and "now" is passed in.
 *
 * For pickup date D and lines with notices n₁…nₖ: order by the day's cutoff time on D − max(day's cutoffDaysBefore, max nᵢ).
 * Notice 0 means "no more than the day's own cutoff".
 */

/** "Only 2 orders left that day" from here down. */
export const FEW_ORDERS_LEFT = 3

/** One date of the booking window, from its MenuDay or — unplanned — the Settings defaults and opening hours. */
export type BookingDay = {
  date: IsoDate
  /** A MenuDay row exists. */
  planned: boolean
  /** MenuDay.isOpen; for an unplanned date, false only on a weekday the opening hours mark closed. */
  isOpen: boolean
  /** The day's own cutoff (MenuDay.cutoffAt — the source of truth), epoch ms. */
  cutoffAt: number
  cutoffTime: string
  cutoffDaysBefore: number
  /** Verified orders the owner takes — the verify-time limit. */
  maxOrders: number
  /** Orders in all before the day is fully booked — the submit-time limit. */
  overbookLimit: number
  /** Live orders (pending + verified), what overbookLimit counts. */
  taken: number
  /** Verified, ready or collected orders, what maxOrders counts. */
  verified: number
}

/** The booking window as one screen sees it: today … today + orderAheadDays, judged at `now`. */
export type BookingWindow = {
  today: IsoDate
  /** today + orderAheadDays. */
  lastDay: IsoDate
  now: number
  timeZone: string
  /** Settings.orderingPaused — it stops every date at once, so it isn't a day's availability. */
  paused: boolean
  /** Every date from today to lastDay, in order. */
  days: BookingDay[]
}

/** Why a date can or can't take an order — in precedence order: past › tooFar › closed › tooSoon › full. */
export type Availability = "open" | "tooSoon" | "closed" | "full" | "past" | "tooFar"

/** The notice the deadline is measured with — the longest of the lines', never below 0. */
export function noticeOf(notices: readonly number[]): number {
  return Math.max(0, ...notices)
}

type DeadlineDay = Pick<BookingDay, "date" | "cutoffAt" | "cutoffTime" | "cutoffDaysBefore">

/** When ordering `notices` for the day closes, epoch ms. The day's own cutoff unless a line needs longer. */
export function deadlineFor(day: DeadlineDay, notices: readonly number[], timeZone: string): number {
  const notice = noticeOf(notices)
  if (notice <= day.cutoffDaysBefore) return day.cutoffAt
  return computeCutoffAt(day.date, day.cutoffTime, notice, timeZone).getTime()
}

/** The day's own cutoff has passed — nothing can be ordered for it any more, whatever the notice. */
export function pastCutoff(day: Pick<BookingDay, "cutoffAt">, now: number): boolean {
  return day.cutoffAt <= now
}

/** Orders the day still accepts: overbookLimit − live orders, never below 0. */
export function ordersLeft(day: Pick<BookingDay, "overbookLimit" | "taken">): number {
  return Math.max(0, day.overbookLimit - day.taken)
}

/** Whether `day` can take an order for lines with these notices, and if not, the first reason why. */
export function dayAvailability(day: BookingDay, notices: readonly number[], window: Omit<BookingWindow, "days" | "paused">): Availability {
  if (day.date < window.today) return "past"
  if (day.date > window.lastDay) return "tooFar"
  if (!day.isOpen) return "closed"
  if (deadlineFor(day, notices, window.timeZone) <= window.now) return "tooSoon"
  if (day.taken >= day.overbookLimit) return "full"
  return "open"
}

/** The first date of the window that takes an order for every one of these notices, or null when none does. */
export function earliestDate(notices: readonly number[], window: BookingWindow, except?: IsoDate): IsoDate | null {
  return window.days.find((day) => day.date !== except && dayAvailability(day, notices, window) === "open")?.date ?? null
}

/** A line too soon for `day` on its own: its notice, not the day's cutoff, is why. */
export function lineTooSoon(day: DeadlineDay, notice: number, window: Pick<BookingWindow, "now" | "timeZone">): boolean {
  return deadlineFor(day, [notice], window.timeZone) <= window.now
}

/** The line to name when a date is too soon: the one with the longest notice. Null for no lines. */
export function longestNotice<T extends { noticeDays: number }>(lines: readonly T[]): T | null {
  return lines.reduce<T | null>((longest, line) => (!longest || line.noticeDays > longest.noticeDays ? line : longest), null)
}
