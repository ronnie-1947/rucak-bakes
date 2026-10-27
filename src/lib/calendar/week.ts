import type { OrderStatus } from "@/generated/prisma/enums"
import { type CopyDayFacts, type CopyRow, planWeekCopy } from "@/lib/calendar/copy-plan"
import type { CutoffChoice } from "@/lib/calendar/cutoffs"
import { dayHref, weekBounds, weekHref } from "@/lib/calendar/routes"
import { addDays, dateRange, formatDayLabel, formatDayNumber, formatShortDate, formatWeekday, fromDbDate, type IsoDate, todayIn, toDbDate, weekStart } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { openByDefault } from "@/lib/orders/booking"
import { LIVE_STATUSES, VERIFIED_STATUSES } from "@/lib/orders/status"
import { getSettings } from "@/lib/settings/row"

/** Read model for the week planner (/admin/calendar). */

/** An order a close confirm names — code and customer. */
export type DayOrder = { id: string; code: string; name: string }

/** A live order on a week card: who, whether it's verified, and its biggest line. */
export type WeekOrder = DayOrder & { verified: boolean; main: { name: string; quantity: number } | null }

/** One counter-item (§10R) — what's baked for the counter, and how many. */
export type CounterItem = { name: string; quantity: number }

export type WeekDay = {
  date: IsoDate
  weekdayName: string
  /** "3 Oct" */
  dateLabel: string
  isToday: boolean
  /** Before today — read-only. */
  isPast: boolean
  /** A MenuDay row exists. An unplanned day shows the bakery's defaults — open unless the opening hours close its weekday. */
  planned: boolean
  isOpen: boolean
  closureNote: string | null
  cutoff: CutoffChoice
  maxOrders: number
  /** Its counter-items, in category order. */
  counter: CounterItem[]
  verified: number
  pending: number
  /** Orders still alive, by pickup time — the card lists the first three; closing the day names them all. */
  liveOrders: WeekOrder[]
  editHref: string
}

export type WeekPlan = {
  monday: IsoDate
  today: IsoDate
  /** "Mon 5 – Sun 11 Oct" */
  rangeLabel: string
  /** The week "Copy last week" copies from. */
  previousRangeLabel: string
  prevHref: string | null
  nextHref: string | null
  /** null when this is already the current week. */
  thisWeekHref: string | null
  /** Every day has passed — the planner is read-only. */
  isPastWeek: boolean
  days: WeekDay[]
  /** What Copy last week would change and skip, day by day. */
  copy: CopyRow[]
  /** The bakery's defaults — the Apply panel starts from them. */
  defaults: { cutoff: CutoffChoice; maxOrders: number }
}

/** "Mon 5 – Sun 11 Oct", or "Mon 28 Sep – Sun 4 Oct" across a month end. */
export function weekRangeLabel(monday: IsoDate): string {
  const sunday = addDays(monday, 6)
  const start = formatDayLabel(monday)
  const sameMonth = monday.slice(0, 7) === sunday.slice(0, 7)
  return `${sameMonth ? formatDayNumber(monday) : start} – ${formatDayLabel(sunday)}`
}

export async function loadWeek(monday: IsoDate): Promise<WeekPlan> {
  const settings = await getSettings()
  const today = todayIn(settings.timezone)
  const from = addDays(monday, -7)
  const sunday = addDays(monday, 6)

  const [categories, days, orders] = await Promise.all([
    prisma.menuCategory.findMany({ select: { slug: true, sortOrder: true } }),
    prisma.menuDay.findMany({
      where: { date: { gte: toDbDate(from), lte: toDbDate(sunday) } },
      select: {
        id: true,
        date: true,
        isOpen: true,
        closureNote: true,
        cutoffTime: true,
        cutoffDaysBefore: true,
        maxOrders: true,
        items: { select: { quantityAvailable: true, menuItem: { select: { name: true, category: true, isActive: true, archivedAt: true } } } },
      },
    }),
    // This week's days only — `days` reaches back a week further, for the copy-last-week check.
    prisma.order.findMany({
      where: { menuDay: { date: { gte: toDbDate(monday), lte: toDbDate(sunday) } }, status: { in: [...LIVE_STATUSES] } },
      select: {
        id: true,
        code: true,
        customerName: true,
        status: true,
        menuDayId: true,
        pickupTime: true,
        items: { select: { name: true, quantity: true }, orderBy: { lineTotalPaise: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const sortOrder = new Map(categories.map((category) => [category.slug, category.sortOrder]))
  const byDate = new Map(days.map((day) => [fromDbDate(day.date), day]))
  const ordersOf = (menuDayId: string) =>
    orders.filter((order) => order.menuDayId === menuDayId).sort((a, b) => (a.pickupTime ?? "99:99").localeCompare(b.pickupTime ?? "99:99"))
  const count = (list: { status: OrderStatus }[], statuses: readonly OrderStatus[]) => list.filter((order) => statuses.includes(order.status)).length

  const weekDays = dateRange(monday, sunday).map((date): WeekDay => {
    const day = byDate.get(date)
    const live = day ? ordersOf(day.id) : []
    const rank = (category: string | null) => sortOrder.get(category ?? "") ?? 99
    const counter = (day?.items ?? [])
      .sort((a, b) => rank(a.menuItem.category) - rank(b.menuItem.category) || a.menuItem.name.localeCompare(b.menuItem.name))
      .map((row) => ({ name: row.menuItem.name, quantity: row.quantityAvailable }))
    return {
      date,
      weekdayName: formatWeekday(date),
      dateLabel: formatShortDate(date),
      isToday: date === today,
      isPast: date < today,
      planned: Boolean(day),
      isOpen: day?.isOpen ?? openByDefault(date, settings.openingHours),
      closureNote: day?.closureNote ?? null,
      cutoff: day ? { time: day.cutoffTime, daysBefore: day.cutoffDaysBefore } : { time: settings.defaultCutoffTime, daysBefore: settings.defaultCutoffDays },
      maxOrders: day?.maxOrders ?? settings.defaultMaxOrders,
      counter,
      verified: count(live, VERIFIED_STATUSES),
      pending: live.length - count(live, VERIFIED_STATUSES),
      liveOrders: live.map((order) => ({
        id: order.id,
        code: order.code,
        name: order.customerName,
        verified: VERIFIED_STATUSES.includes(order.status),
        main: order.items[0] ?? null,
      })),
      editHref: dayHref(date),
    }
  })

  const facts = (date: IsoDate, liveOrders: number, sourceRole: boolean): CopyDayFacts => {
    const day = byDate.get(date)
    const items = day?.items.filter((row) => !sourceRole || (row.menuItem.isActive && !row.menuItem.archivedAt)).length ?? 0
    return { date, planned: Boolean(day), isOpen: day?.isOpen ?? openByDefault(date, settings.openingHours), liveOrders, items }
  }
  const source = new Map(dateRange(from, addDays(monday, -1)).map((date) => [date, facts(date, 0, true)]))
  const target = weekDays.map((day) => facts(day.date, day.liveOrders.length, false))

  const { first, last } = weekBounds(today)
  const thisWeek = weekStart(today)
  return {
    monday,
    today,
    rangeLabel: weekRangeLabel(monday),
    previousRangeLabel: weekRangeLabel(from),
    prevHref: monday > first ? weekHref(addDays(monday, -7), today) : null,
    nextHref: monday < last ? weekHref(addDays(monday, 7), today) : null,
    thisWeekHref: monday === thisWeek ? null : weekHref(thisWeek, today),
    isPastWeek: sunday < today,
    days: weekDays,
    copy: planWeekCopy(target, source, today),
    defaults: { cutoff: { time: settings.defaultCutoffTime, daysBefore: settings.defaultCutoffDays }, maxOrders: settings.defaultMaxOrders },
  }
}
