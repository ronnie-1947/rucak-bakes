import { FulfilmentType, OrderStatus } from "@/generated/prisma/client"
import { dayHref, inPlanningRange } from "@/lib/calendar/routes"
import { addDays, formatDayLabel, formatDayTimeIn, formatLongDayLabel, formatTimeIn, type IsoDate, todayIn, toDbDate } from "@/lib/dates"
import { mentionsAllergen } from "@/lib/daysheet/notes"
import { parseSheetParams, type SheetParams, sheetHref } from "@/lib/daysheet/routes"
import { prisma } from "@/lib/db"
import { asPriceUnit, type PriceUnit } from "@/lib/menu/units"
import { CLEARED, filtersHref } from "@/lib/orders/filters"
import { LIVE_STATUSES, VERIFIED_STATUSES } from "@/lib/orders/status"
import { formatForDisplay } from "@/lib/phone"
import { getSettings } from "@/lib/settings/row"

/**
 * Read model for the day sheet (/admin/daysheet): one fulfilment day's orders turned into what to bake and
 * who collects when. Bake totals count VERIFIED, READY and COMPLETED orders only; pending quantities are
 * counted beside them and never merged in. Cancelled and no-show orders are not on the sheet at all.
 */

export type BakeRow = {
  menuItemId: string
  /** The day's MenuDayItem — what the Baked tick writes. Null if the item has since left the day. */
  tickId: string | null
  /** The item's current name — the bake list is about the recipe, not what the order snapshot called it. */
  name: string
  /** Units on verified orders — the bake total. */
  verified: number
  /** Units on pending orders — shown separately when asked for, never added to `verified`. */
  pending: number
  unit: PriceUnit
  sizeNote: string | null
  /** On a verified order that carries a customer note. */
  noted: boolean
  /** On a pending order that carries one. */
  pendingNoted: boolean
  baked: boolean
}

/** A category's rows, in the bakery's category order. `name` is null for items without a category. */
export type BakeGroup = { name: string | null; rows: BakeRow[] }

export type PickupSlot = "morning" | "afternoon" | "anytime" | "delivery"

export type SheetOrder = {
  id: string
  code: string
  pending: boolean
  /** COMPLETED — handed over. */
  collected: boolean
  /** "07:34", bakery-local. */
  collectedAt: string | null
  slot: PickupSlot
  name: string
  phoneE164: string
  phoneDisplay: string
  /** Snapshot names, as the customer ordered them. */
  lines: { name: string; quantity: number }[]
  totalPaise: number
  delivery: boolean
  /** "11:30", or null when the customer didn't choose one (deliveries never carry one). */
  time: string | null
  address: string | null
  note: string | null
  allergen: boolean
  trusted: boolean
}

export type SheetNote = {
  orderId: string
  code: string
  name: string
  time: string | null
  delivery: boolean
  text: string
  allergen: boolean
  pending: boolean
}

/**
 * What the sheet was built from, for the poller. `orders` changes when an order arrives, is verified or
 * leaves the day — the sheet asks before reshuffling. `ticks` changes when another device ticks something —
 * the sheet just refreshes.
 */
export type SheetVersion = { orders: string[]; ticks: string }

/** Why there is no sheet to show. Null: there are live orders. */
export type SheetState = "closed" | "beyond" | "empty" | null

export type DaySheetData = {
  params: SheetParams
  today: IsoDate
  /** "Saturday 3 Oct" */
  title: string
  isToday: boolean
  /** Before today — shown as it was left, nothing can be ticked. */
  isPast: boolean
  state: SheetState
  /** Closed in the Calendar. With `state` null, orders are still open on it. */
  closed: boolean
  orderAheadDays: number
  hrefs: {
    prev: string
    next: string
    today: string
    /** Each view with the other params kept. */
    bake: string
    pickups: string
    /** The same view with pending switched the other way. */
    togglePending: string
    calendar: string
    pendingOrders: string
  }
  /** "Sun 4 Oct" — the empty state's way on. */
  nextLabel: string
  verifiedCount: number
  pendingCount: number
  /** Units across verified orders. */
  itemCount: number
  /** Earliest and latest chosen pickup time among verified pickups. */
  firstTime: string | null
  lastTime: string | null
  bake: BakeGroup[]
  /** Allergen notes first, then by time. */
  notes: SheetNote[]
  /** Every live order, by time — the screen drops pending ones unless asked. */
  orders: SheetOrder[]
  version: SheetVersion
  bakeryName: string
  /** "Sat 3 Oct, 05:02" — when this was read; the printout says it. */
  asOf: string
}

const isVerified = (status: OrderStatus) => VERIFIED_STATUSES.includes(status)

function slotOf(delivery: boolean, time: string | null): PickupSlot {
  if (delivery) return "delivery"
  if (!time) return "anytime"
  return time < "12:00" ? "morning" : "afternoon"
}

function versionOf(orders: { id: string; status: OrderStatus }[], bakedIds: string[]): SheetVersion {
  const collected = orders.filter((order) => order.status === OrderStatus.COMPLETED).map((order) => order.id)
  return {
    orders: orders.map((order) => `${order.id}:${order.status === OrderStatus.PENDING ? "p" : "v"}`).sort(),
    ticks: `${[...bakedIds].sort().join(",")}|${collected.sort().join(",")}`,
  }
}

/** Just the version — what the open sheet polls. Two small queries. */
export async function loadSheetVersion(date: IsoDate): Promise<SheetVersion> {
  const day = toDbDate(date)
  const [orders, baked] = await Promise.all([
    prisma.order.findMany({ where: { fulfilmentDate: day, status: { in: [...LIVE_STATUSES] } }, select: { id: true, status: true } }),
    prisma.menuDayItem.findMany({ where: { menuDay: { date: day }, bakedAt: { not: null } }, select: { id: true } }),
  ])
  return versionOf(orders, baked.map((row) => row.id))
}

export async function loadDaySheet(searchParams: Record<string, string | string[] | undefined>): Promise<DaySheetData> {
  const settings = await getSettings()
  const tz = settings.timezone
  const today = todayIn(tz)
  const params = parseSheetParams(searchParams, today)
  const { date } = params

  const [day, orders, categories] = await Promise.all([
    prisma.menuDay.findUnique({
      where: { date: toDbDate(date) },
      select: { isOpen: true, items: { select: { id: true, menuItemId: true, bakedAt: true } } },
    }),
    prisma.order.findMany({
      where: { fulfilmentDate: toDbDate(date), status: { in: [...LIVE_STATUSES] } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        code: true,
        status: true,
        completedAt: true,
        fulfilmentType: true,
        pickupTime: true,
        deliveryAddress: true,
        customerName: true,
        customerPhone: true,
        customerNote: true,
        totalPaise: true,
        items: { select: { menuItemId: true, name: true, quantity: true }, orderBy: { lineTotalPaise: "desc" } },
        customer: { select: { isTrusted: true } },
      },
    }),
    prisma.menuCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true, name: true } }),
  ])

  const itemIds = [...new Set(orders.flatMap((order) => order.items.map((line) => line.menuItemId)))]
  const catalogue = await prisma.menuItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true, category: true, priceUnit: true, sizeNote: true },
  })

  // Bake totals: verified and pending kept apart from the first line.
  const dayItemOf = new Map((day?.items ?? []).map((row) => [row.menuItemId, row]))
  const rows = new Map<string, BakeRow>()
  for (const item of catalogue) {
    const dayItem = dayItemOf.get(item.id)
    rows.set(item.id, {
      menuItemId: item.id,
      tickId: dayItem?.id ?? null,
      name: item.name,
      verified: 0,
      pending: 0,
      unit: asPriceUnit(item.priceUnit),
      sizeNote: item.sizeNote,
      noted: false,
      pendingNoted: false,
      baked: Boolean(dayItem?.bakedAt),
    })
  }
  for (const order of orders) {
    const verified = isVerified(order.status)
    for (const line of order.items) {
      const row = rows.get(line.menuItemId)
      if (!row) continue
      if (verified) row.verified += line.quantity
      else row.pending += line.quantity
      if (order.customerNote && verified) row.noted = true
      if (order.customerNote && !verified) row.pendingNoted = true
    }
  }

  const categoryOf = new Map(catalogue.map((item) => [item.id, item.category]))
  const byTotal = (a: BakeRow, b: BakeRow) => b.verified - a.verified || b.pending - a.pending || a.name.localeCompare(b.name)
  const known = new Set(categories.map((category) => category.slug))
  const bake: BakeGroup[] = [
    ...categories.map((category) => ({
      name: category.name,
      rows: [...rows.values()].filter((row) => categoryOf.get(row.menuItemId) === category.slug).sort(byTotal),
    })),
    { name: null, rows: [...rows.values()].filter((row) => !known.has(categoryOf.get(row.menuItemId) ?? "")).sort(byTotal) },
  ].filter((group) => group.rows.length > 0)

  const sheetOrders: SheetOrder[] = orders
    .map((order) => {
      const delivery = order.fulfilmentType === FulfilmentType.DELIVERY
      return {
        id: order.id,
        code: order.code,
        pending: order.status === OrderStatus.PENDING,
        collected: order.status === OrderStatus.COMPLETED,
        collectedAt: order.completedAt ? formatTimeIn(order.completedAt, tz) : null,
        slot: slotOf(delivery, order.pickupTime),
        name: order.customerName,
        phoneE164: order.customerPhone,
        phoneDisplay: formatForDisplay(order.customerPhone),
        lines: order.items.map((line) => ({ name: line.name, quantity: line.quantity })),
        totalPaise: order.totalPaise,
        delivery,
        time: order.pickupTime,
        address: order.deliveryAddress,
        note: order.customerNote,
        allergen: order.customerNote ? mentionsAllergen(order.customerNote) : false,
        trusted: order.customer.isTrusted,
      }
    })
    // Stable sort: orders with the same time (or none) stay in the order they were placed.
    .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"))

  const notes: SheetNote[] = sheetOrders
    .filter((order) => order.note)
    .map((order) => ({
      orderId: order.id,
      code: order.code,
      name: order.name,
      time: order.time,
      delivery: order.delivery,
      text: order.note ?? "",
      allergen: order.allergen,
      pending: order.pending,
    }))
    .sort((a, b) => Number(b.allergen) - Number(a.allergen))

  const verifiedOrders = orders.filter((order) => isVerified(order.status))
  const times = verifiedOrders
    .filter((order) => order.fulfilmentType === FulfilmentType.PICKUP && order.pickupTime)
    .map((order) => order.pickupTime as string)
    .sort()

  const closed = Boolean(day && !day.isOpen)
  const state: SheetState = orders.length > 0 ? null : closed ? "closed" : date > addDays(today, settings.orderAheadDays) ? "beyond" : "empty"

  const href = (next: Partial<SheetParams>) => sheetHref({ ...params, ...next }, today)

  return {
    params,
    today,
    title: formatLongDayLabel(date),
    isToday: date === today,
    isPast: date < today,
    state,
    closed,
    orderAheadDays: settings.orderAheadDays,
    hrefs: {
      prev: href({ date: addDays(date, -1) }),
      next: href({ date: addDays(date, 1) }),
      today: href({ date: today }),
      bake: href({ view: "bake" }),
      pickups: href({ view: "pickups" }),
      togglePending: href({ pending: !params.pending }),
      calendar: inPlanningRange(date, today) ? dayHref(date) : "/admin/calendar",
      pendingOrders: filtersHref({ ...CLEARED, dates: [date], status: OrderStatus.PENDING, order: null, select: false }),
    },
    nextLabel: formatDayLabel(addDays(date, 1)),
    verifiedCount: verifiedOrders.length,
    pendingCount: orders.length - verifiedOrders.length,
    itemCount: verifiedOrders.reduce((sum, order) => sum + order.items.reduce((units, line) => units + line.quantity, 0), 0),
    firstTime: times[0] ?? null,
    lastTime: times.at(-1) ?? null,
    bake,
    notes,
    orders: sheetOrders,
    version: versionOf(orders, (day?.items ?? []).filter((row) => row.bakedAt).map((row) => row.id)),
    bakeryName: settings.bakeryName,
    asOf: formatDayTimeIn(new Date(), tz),
  }
}
