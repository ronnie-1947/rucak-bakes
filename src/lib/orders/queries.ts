import { FulfilmentType, OrderStatus, Prisma } from "@/generated/prisma/client"
import { addDays, formatDayLabel, formatDayTimeIn, formatTimeIn, fromDbDate, type IsoDate, todayIn, toDbDate } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { type OrderFilters, selectedDates } from "@/lib/orders/filters"
import { FLOW, VERIFIED_STATUSES } from "@/lib/orders/status"
import { formatForDisplay } from "@/lib/phone"
import { getSettings } from "@/lib/settings/row"

/**
 * Read models for the admin order screens. Everything a client component renders arrives here as plain
 * data with times already formatted in the bakery's timezone — the browser's own zone never decides
 * what "today" or "11:30" means.
 */

/** A pending order this young gets the "New" marker. */
const NEW_FOR_MS = 15 * 60 * 1000

export type RelativeDay = "today" | "tomorrow" | null

export type OrderTags = {
  /** Orders this customer collected before — "Ordered before (n)". */
  before: number
  trusted: boolean
  noShows: number
  delivery: boolean
  note: boolean
  /** A blocked number. The order was accepted; staff see it greyed and flagged. */
  suspected: boolean
}

export type OrderRowData = {
  id: string
  code: string
  status: OrderStatus
  isNew: boolean
  name: string
  phoneE164: string
  phoneDisplay: string
  lines: { name: string; quantity: number }[]
  totalPaise: number
  fulfilmentType: FulfilmentType
  pickupTime: string | null
  tags: OrderTags
}

export type OrderGroupData = {
  date: IsoDate
  dayLabel: string
  relative: RelativeDay
  orders: OrderRowData[]
  verifiedCount: number
  maxOrders: number | null
}

export type CapacityData = { relative: "today" | "tomorrow"; dayLabel: string; verifiedCount: number; maxOrders: number | null }

export type OrderQueue = {
  today: IsoDate
  groups: OrderGroupData[]
  capacity: CapacityData[]
  /** Upcoming orders whose Telegram notification failed — the owner may not know about them. */
  unnotified: { id: string; code: string }[]
}

function relativeDay(date: IsoDate, today: IsoDate): RelativeDay {
  if (date === today) return "today"
  if (date === addDays(today, 1)) return "tomorrow"
  return null
}

function tagsOf(order: {
  fulfilmentType: FulfilmentType
  customerNote: string | null
  isSuspected: boolean
  customer: { completedCount: number; isTrusted: boolean; noShowCount: number }
}): OrderTags {
  return {
    before: order.customer.completedCount,
    trusted: order.customer.isTrusted,
    noShows: order.customer.noShowCount,
    delivery: order.fulfilmentType === FulfilmentType.DELIVERY,
    note: Boolean(order.customerNote),
    suspected: order.isSuspected,
  }
}

async function verifiedCounts(menuDayIds: string[]): Promise<Map<string, number>> {
  if (menuDayIds.length === 0) return new Map()
  const rows = await prisma.order.groupBy({
    by: ["menuDayId"],
    where: { menuDayId: { in: menuDayIds }, status: { in: [...VERIFIED_STATUSES] } },
    _count: { _all: true },
  })
  return new Map(rows.map((row) => [row.menuDayId, row._count._all]))
}

/** The queue for a filter state: grouped by day, pending first, then by pickup time. */
export async function loadOrderQueue(filters: OrderFilters): Promise<OrderQueue> {
  const settings = await getSettings()
  const today = todayIn(settings.timezone)
  const dates = selectedDates(filters.dates, today)

  const where: Prisma.OrderWhereInput = { fulfilmentDate: { in: dates.map(toDbDate) } }
  if (filters.status !== "ALL") where.status = filters.status
  if (filters.show.includes("call")) where.status = OrderStatus.PENDING
  const customer: Prisma.CustomerWhereInput = {}
  if (filters.show.includes("trusted")) customer.isTrusted = true
  if (filters.show.includes("before")) customer.completedCount = { gt: 0 }
  if (Object.keys(customer).length > 0) where.customer = customer
  if (filters.q) {
    const digits = filters.q.replace(/\D/g, "")
    where.OR = [
      { code: { contains: filters.q, mode: "insensitive" } },
      { customerName: { contains: filters.q, mode: "insensitive" } },
      ...(digits.length >= 3 ? [{ customerPhone: { contains: digits } }] : []),
    ]
  }

  const [orders, days] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        code: true,
        status: true,
        createdAt: true,
        fulfilmentDate: true,
        fulfilmentType: true,
        pickupTime: true,
        customerName: true,
        customerPhone: true,
        customerNote: true,
        totalPaise: true,
        isSuspected: true,
        items: { select: { name: true, quantity: true }, orderBy: { lineTotalPaise: "desc" } },
        customer: { select: { completedCount: true, isTrusted: true, noShowCount: true } },
      },
    }),
    prisma.menuDay.findMany({
      where: { date: { in: [...new Set([...dates, today, addDays(today, 1)])].map(toDbDate) } },
      select: { id: true, date: true, maxOrders: true },
    }),
  ])

  const counts = await verifiedCounts(days.map((day) => day.id))
  const dayByDate = new Map(days.map((day) => [fromDbDate(day.date), day]))
  const capacityOf = (date: IsoDate) => {
    const day = dayByDate.get(date)
    return { verifiedCount: day ? (counts.get(day.id) ?? 0) : 0, maxOrders: day?.maxOrders ?? null }
  }

  const now = Date.now()
  const rank = (order: (typeof orders)[number]) => (order.status === OrderStatus.PENDING ? 0 : 1)
  const groups: OrderGroupData[] = dates
    .map((date) => {
      const rows = orders
        .filter((order) => fromDbDate(order.fulfilmentDate) === date)
        .sort(
          (a, b) =>
            rank(a) - rank(b) ||
            (a.pickupTime ?? "99:99").localeCompare(b.pickupTime ?? "99:99") ||
            a.createdAt.getTime() - b.createdAt.getTime(),
        )
        .map(
          (order): OrderRowData => ({
            id: order.id,
            code: order.code,
            status: order.status,
            isNew: order.status === OrderStatus.PENDING && now - order.createdAt.getTime() < NEW_FOR_MS,
            name: order.customerName,
            phoneE164: order.customerPhone,
            phoneDisplay: formatForDisplay(order.customerPhone),
            lines: order.items,
            totalPaise: order.totalPaise,
            fulfilmentType: order.fulfilmentType,
            pickupTime: order.pickupTime,
            tags: tagsOf(order),
          }),
        )
      return { date, dayLabel: formatDayLabel(date), relative: relativeDay(date, today), orders: rows, ...capacityOf(date) }
    })
    .filter((group) => group.orders.length > 0)

  const capacity: CapacityData[] = (["today", "tomorrow"] as const).map((relative) => {
    const date = relative === "today" ? today : addDays(today, 1)
    return { relative, dayLabel: formatDayLabel(date), ...capacityOf(date) }
  })

  const unnotified = await prisma.order.findMany({
    where: { notificationFailed: true, status: OrderStatus.PENDING, fulfilmentDate: { gte: toDbDate(today) } },
    select: { id: true, code: true },
    orderBy: { createdAt: "asc" },
  })

  return { today, groups, capacity, unnotified }
}

export type ActivityEntry = {
  at: string
  kind: "placed" | "verified" | "autoVerified" | "ready" | "completed" | "cancelled" | "noShow"
  by: string | null
}

export type OrderDetailData = {
  id: string
  code: string
  status: OrderStatus
  isSuspected: boolean
  notificationFailed: boolean
  date: IsoDate
  dayLabel: string
  relative: RelativeDay
  fulfilmentType: FulfilmentType
  pickupTime: string | null
  deliveryAddress: string | null
  customer: {
    id: string
    /** The name as typed on this order — a snapshot. */
    name: string
    phoneE164: string
    phoneDisplay: string
    tags: OrderTags
    history: { id: string; code: string; dayLabel: string; itemCount: number; totalPaise: number; status: OrderStatus }[]
  }
  customerNote: string | null
  internalNote: string | null
  lines: { name: string; unitPricePaise: number; quantity: number; lineTotalPaise: number }[]
  subtotalPaise: number
  deliveryFeePaise: number
  totalPaise: number
  /** Each step of the happy path with when it happened, if it did. */
  timeline: { status: OrderStatus; at: string | null }[]
  /** Set when the order left the happy path. */
  closed: { status: OrderStatus; at: string | null; by: string | null; note: string | null } | null
  activity: ActivityEntry[]
  capacity: { verifiedCount: number; maxOrders: number }
}

export async function loadOrderDetail(id: string): Promise<OrderDetailData | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { lineTotalPaise: "desc" } },
      customer: true,
      menuDay: { select: { maxOrders: true } },
      verifiedBy: { select: { name: true } },
      cancelledBy: { select: { name: true } },
    },
  })
  if (!order) return null

  const settings = await getSettings()
  const tz = settings.timezone
  const today = todayIn(tz)
  const date = fromDbDate(order.fulfilmentDate)
  const stamp = (at: Date | null) => (at ? formatDayTimeIn(at, tz) : null)

  const [history, verifiedCount] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: order.customerId, id: { not: order.id } },
      orderBy: { fulfilmentDate: "desc" },
      take: 3,
      select: { id: true, code: true, fulfilmentDate: true, totalPaise: true, status: true, _count: { select: { items: true } } },
    }),
    prisma.order.count({ where: { menuDayId: order.menuDayId, status: { in: [...VERIFIED_STATUSES] } } }),
  ])

  const at: Record<OrderStatus, Date | null> = {
    PENDING: order.createdAt,
    VERIFIED: order.verifiedAt,
    READY: order.readyAt,
    COMPLETED: order.completedAt,
    CANCELLED: order.cancelledAt,
    NO_SHOW: order.cancelledAt,
  }
  const closedStatus = order.status === OrderStatus.CANCELLED || order.status === OrderStatus.NO_SHOW

  const activity: (ActivityEntry & { time: number })[] = [
    { time: order.createdAt.getTime(), at: formatTimeIn(order.createdAt, tz), kind: "placed", by: null },
  ]
  if (order.verifiedAt) {
    activity.push({
      time: order.verifiedAt.getTime(),
      at: formatTimeIn(order.verifiedAt, tz),
      kind: order.verifiedBy ? "verified" : "autoVerified",
      by: order.verifiedBy?.name ?? null,
    })
  }
  if (order.readyAt) activity.push({ time: order.readyAt.getTime(), at: formatTimeIn(order.readyAt, tz), kind: "ready", by: null })
  if (order.completedAt) activity.push({ time: order.completedAt.getTime(), at: formatTimeIn(order.completedAt, tz), kind: "completed", by: null })
  if (closedStatus && order.cancelledAt) {
    activity.push({
      time: order.cancelledAt.getTime(),
      at: formatTimeIn(order.cancelledAt, tz),
      kind: order.status === OrderStatus.NO_SHOW ? "noShow" : "cancelled",
      by: order.cancelledBy?.name ?? null,
    })
  }

  return {
    id: order.id,
    code: order.code,
    status: order.status,
    isSuspected: order.isSuspected,
    notificationFailed: order.notificationFailed,
    date,
    dayLabel: formatDayLabel(date),
    relative: relativeDay(date, today),
    fulfilmentType: order.fulfilmentType,
    pickupTime: order.pickupTime,
    deliveryAddress: order.deliveryAddress,
    customer: {
      id: order.customer.id,
      name: order.customerName,
      phoneE164: order.customerPhone,
      phoneDisplay: formatForDisplay(order.customerPhone),
      tags: tagsOf(order),
      history: history.map((past) => ({
        id: past.id,
        code: past.code,
        dayLabel: formatDayLabel(fromDbDate(past.fulfilmentDate)),
        itemCount: past._count.items,
        totalPaise: past.totalPaise,
        status: past.status,
      })),
    },
    customerNote: order.customerNote,
    internalNote: order.internalNote,
    lines: order.items.map((item) => ({ name: item.name, unitPricePaise: item.unitPricePaise, quantity: item.quantity, lineTotalPaise: item.lineTotalPaise })),
    subtotalPaise: order.subtotalPaise,
    deliveryFeePaise: order.deliveryFeePaise,
    totalPaise: order.totalPaise,
    timeline: FLOW.map((status) => ({ status, at: stamp(at[status]) })),
    closed: closedStatus
      ? { status: order.status, at: stamp(order.cancelledAt), by: order.cancelledBy?.name ?? null, note: order.cancellationNote }
      : null,
    activity: activity.sort((a, b) => a.time - b.time).map(({ at, kind, by }) => ({ at, kind, by })),
    capacity: { verifiedCount, maxOrders: order.menuDay.maxOrders },
  }
}
