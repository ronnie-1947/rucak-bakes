import { OrderStatus } from "@/generated/prisma/enums"
import { isNewCustomer } from "@/lib/customers/queries"
import { formatShortDate, formatWeekday, fromDbDate, type IsoDate, isoDateInZone, weekday } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { formatForDisplay } from "@/lib/phone"
import { getSettings } from "@/lib/settings/row"

/** Read model for one customer (/admin/customers/[id], and the list's 2xl pane). */

export type CustomerOrder = {
  id: string
  code: string
  date: IsoDate
  /** "Sat" */
  weekdayLabel: string
  /** "3 Oct" */
  dateLabel: string
  /** "2026-10" — the history groups by it. */
  month: string
  status: OrderStatus
  totalPaise: number
  lines: { name: string; quantity: number }[]
}

export type CustomerPatterns = {
  /** The two items on most of their orders, with how many orders carried each. */
  usual: { name: string; count: number }[]
  /** "Saturday" — the weekday they most often collect on. */
  weekday: string
  /** Their average order, rounded to ₹10. */
  averagePaise: number
}

export type CustomerDetailData = {
  id: string
  name: string
  phoneE164: string
  phoneDisplay: string
  isTrusted: boolean
  isBlocked: boolean
  isNew: boolean
  /** "12 Mar 2026" */
  sinceLabel: string
  /** Kept from their last delivery order. */
  address: string | null
  internalNote: string | null
  facts: { orders: number; completed: number; cancelled: number; noShows: number; spentPaise: number }
  /** Pending, verified or ready — on top, marked Active. */
  live: CustomerOrder[]
  /** Everything else, newest first. */
  past: CustomerOrder[]
  /** Orders per month in `past` — the month headers' counts. */
  monthCounts: Record<string, number>
  /** Only with three or more orders that went ahead. */
  patterns: CustomerPatterns | null
  /** Settings.autoVerifyTrusted — what marking someone trusted actually does. */
  autoVerifyTrusted: boolean
}

const LIVE: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.VERIFIED, OrderStatus.READY]
const WENT_AHEAD: OrderStatus[] = [...LIVE, OrderStatus.COMPLETED]
const PATTERN_MIN = 3

const weekdayShort = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short" })
const fullDate = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" })

function patternsOf(orders: { status: OrderStatus; date: IsoDate; totalPaise: number; lines: { name: string }[] }[]): CustomerPatterns | null {
  const counted = orders.filter((order) => WENT_AHEAD.includes(order.status))
  if (counted.length < PATTERN_MIN) return null

  const items = new Map<string, number>()
  for (const order of counted) for (const name of new Set(order.lines.map((line) => line.name))) items.set(name, (items.get(name) ?? 0) + 1)
  const usual = [...items.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([name, count]) => ({ name, count }))

  const days = new Map<number, { count: number; date: IsoDate }>()
  for (const order of counted) days.set(weekday(order.date), { count: (days.get(weekday(order.date))?.count ?? 0) + 1, date: order.date })
  const [busiest] = [...days.entries()].sort((a, b) => b[1].count - a[1].count || a[0] - b[0])

  const average = counted.reduce((sum, order) => sum + order.totalPaise, 0) / counted.length
  return { usual, weekday: formatWeekday(busiest[1].date), averagePaise: Math.round(average / 1000) * 1000 }
}

export async function loadCustomerDetail(id: string): Promise<CustomerDetailData | null> {
  const settings = await getSettings()
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: [{ fulfilmentDate: "desc" }, { createdAt: "desc" }],
        select: { id: true, code: true, fulfilmentDate: true, status: true, totalPaise: true, items: { select: { name: true, quantity: true }, orderBy: { lineTotalPaise: "desc" } } },
      },
    },
  })
  if (!customer) return null

  const orders: CustomerOrder[] = customer.orders.map((order) => {
    const date = fromDbDate(order.fulfilmentDate)
    return {
      id: order.id,
      code: order.code,
      date,
      weekdayLabel: weekdayShort.format(order.fulfilmentDate),
      dateLabel: formatShortDate(date),
      month: date.slice(0, 7),
      status: order.status,
      totalPaise: order.totalPaise,
      lines: order.items,
    }
  })
  const past = orders.filter((order) => !LIVE.includes(order.status))
  const monthCounts: Record<string, number> = {}
  for (const order of past) monthCounts[order.month] = (monthCounts[order.month] ?? 0) + 1
  const since = customer.firstOrderAt ?? customer.createdAt

  return {
    id: customer.id,
    name: customer.name,
    phoneE164: customer.phoneE164,
    phoneDisplay: formatForDisplay(customer.phoneE164),
    isTrusted: customer.isTrusted,
    isBlocked: customer.isBlocked,
    isNew: isNewCustomer(customer.firstOrderAt, settings.timezone),
    sinceLabel: fullDate.format(new Date(`${isoDateInZone(since, settings.timezone)}T00:00:00Z`)),
    address: customer.address,
    internalNote: customer.internalNote,
    facts: {
      orders: customer.orderCount,
      completed: customer.completedCount,
      cancelled: orders.filter((order) => order.status === OrderStatus.CANCELLED).length,
      noShows: customer.noShowCount,
      spentPaise: customer.totalSpentPaise,
    },
    live: orders.filter((order) => LIVE.includes(order.status)),
    past,
    monthCounts,
    patterns: patternsOf(orders),
    autoVerifyTrusted: settings.autoVerifyTrusted,
  }
}
