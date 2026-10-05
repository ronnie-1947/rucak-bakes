import { FulfilmentType, OrderStatus } from "@/generated/prisma/client"
import { dayHref, inPlanningRange } from "@/lib/calendar/routes"
import { formatClock } from "@/lib/calendar/cutoffs"
import { addDays, formatDayLabel, formatLongDayLabel, formatTimeIn, type IsoDate, isoDateInZone, todayIn, toDbDate } from "@/lib/dates"
import { mentionsAllergen } from "@/lib/daysheet/notes"
import { parseSheetParams, type SheetParams, sheetHref } from "@/lib/daysheet/routes"
import { prisma } from "@/lib/db"
import { asPriceUnit, type PriceUnit } from "@/lib/menu/units"
import { CLEARED, filtersHref } from "@/lib/orders/filters"
import { LIVE_STATUSES, VERIFIED_STATUSES } from "@/lib/orders/status"
import { formatForDisplay } from "@/lib/phone"
import { getSettings } from "@/lib/settings/row"

/**
 * Read model for the day sheet (/admin/daysheet, §10R): one fulfilment day turned into what to bake — For orders (totals
 * per item, plus Made to order lines), then the day's counter-items — and who collects when. Order totals count VERIFIED,
 * READY and COMPLETED orders only; pending quantities are counted beside them and never merged in. Cancelled and no-show
 * orders are not on the sheet at all.
 */

/** A For orders row — one menu item across the day's orders. Its tick is every verified line of it (`OrderItem.bakedAt`). */
export type BakeRow = {
  menuItemId: string
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
  /** The orders it's on, as "Meera BK-4821" — pending ones only show with Include pending. */
  who: { name: string; code: string; pending: boolean }[]
  /** Every verified line of it is baked. */
  baked: boolean
}

/** A Made to order row — one line of an item that bakes separately (`MenuItem.bakeSeparately`), with its order's note. */
export type MadeRow = {
  /** The OrderItem — what its tick writes. */
  lineId: string
  quantity: number
  /** As ordered — the line's snapshot name. */
  name: string
  sizeNote: string | null
  customer: string
  code: string
  note: string | null
  allergen: boolean
  pending: boolean
  baked: boolean
}

/** A counter-item (§10R) — baked for the counter, never ordered online. Its tick is `MenuDayItem.bakedAt`. */
export type CounterRow = {
  tickId: string
  name: string
  /** Quantity made. */
  quantity: number
  unit: PriceUnit
  sizeNote: string | null
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
  /** "11:30am" */
  time: string | null
  delivery: boolean
  text: string
  allergen: boolean
  pending: boolean
}

/**
 * What the sheet was built from, for the poller. `orders` changes when an order arrives, is verified or
 * leaves the day — one leaving (cancelled, no-show) just refreshes the sheet, the others ask first. `ticks` changes
 * when another device ticks something — the sheet just refreshes.
 */
export type SheetVersion = { orders: string[]; ticks: string }

/** Why there is no sheet to show. Null: there are live orders, or counter-items on an open day within reach. */
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
  /** Earliest and latest chosen pickup time among verified pickups — "7:30am". */
  firstTime: string | null
  lastTime: string | null
  /** For orders, by category — items that bake separately are under `made` instead. */
  bake: BakeGroup[]
  made: MadeRow[]
  counter: CounterRow[]
  /** Pieces across the counter-items. */
  counterPieces: number
  /** Allergen notes first, then by time. */
  notes: SheetNote[]
  /** Every live order, by time — the screen drops pending ones unless asked. */
  orders: SheetOrder[]
  version: SheetVersion
  bakeryName: string
  /** "Sat 3 Oct, 5:02am" — when this was read; the printout says it. */
  asOf: string
}

const isVerified = (status: OrderStatus) => VERIFIED_STATUSES.includes(status)

function slotOf(delivery: boolean, time: string | null): PickupSlot {
  if (delivery) return "delivery"
  if (!time) return "anytime"
  return time < "12:00" ? "morning" : "afternoon"
}

/** `bakedIds`: baked counter-items and baked order lines — any of them changing is another device's tick. */
function versionOf(orders: { id: string; status: OrderStatus }[], bakedIds: string[]): SheetVersion {
  const collected = orders.filter((order) => order.status === OrderStatus.COMPLETED).map((order) => order.id)
  return {
    orders: orders.map((order) => `${order.id}:${order.status === OrderStatus.PENDING ? "p" : "v"}`).sort(),
    ticks: `${[...bakedIds].sort().join(",")}|${collected.sort().join(",")}`,
  }
}

/** Just the version — what the open sheet polls. Three small queries. */
export async function loadSheetVersion(date: IsoDate): Promise<SheetVersion> {
  const day = toDbDate(date)
  const live = { fulfilmentDate: day, status: { in: [...LIVE_STATUSES] } }
  const [orders, counter, lines] = await Promise.all([
    prisma.order.findMany({ where: live, select: { id: true, status: true } }),
    prisma.menuDayItem.findMany({ where: { menuDay: { date: day }, bakedAt: { not: null } }, select: { id: true } }),
    prisma.orderItem.findMany({ where: { order: live, bakedAt: { not: null } }, select: { id: true } }),
  ])
  return versionOf(orders, [...counter, ...lines].map((row) => row.id))
}

/** "07:30" → "7:30am". */
const clock = (time: string | null) => (time ? formatClock(time) : null)

export async function loadDaySheet(searchParams: Record<string, string | string[] | undefined>): Promise<DaySheetData> {
  const now = new Date()
  const settings = await getSettings()
  const tz = settings.timezone
  const today = todayIn(tz)
  const params = parseSheetParams(searchParams, today)
  const { date } = params

  const [day, orders, categories] = await Promise.all([
    prisma.menuDay.findUnique({
      where: { date: toDbDate(date) },
      select: {
        isOpen: true,
        items: {
          select: {
            id: true,
            quantityAvailable: true,
            bakedAt: true,
            menuItem: { select: { name: true, category: true, priceUnit: true, sizeNote: true } },
          },
        },
      },
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
        items: { select: { id: true, menuItemId: true, name: true, quantity: true, bakedAt: true }, orderBy: { lineTotalPaise: "desc" } },
        customer: { select: { isTrusted: true } },
      },
    }),
    prisma.menuCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true, name: true } }),
  ])

  const itemIds = [...new Set(orders.flatMap((order) => order.items.map((line) => line.menuItemId)))]
  const catalogue = await prisma.menuItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true, category: true, priceUnit: true, sizeNote: true, bakeSeparately: true },
  })
  const separate = new Set(catalogue.filter((item) => item.bakeSeparately).map((item) => item.id))
  const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name

  // For orders: verified and pending kept apart from the first line. A row is baked when every verified line of it is.
  const rows = new Map<string, BakeRow>()
  const unbaked = new Set<string>()
  for (const item of catalogue.filter((entry) => !separate.has(entry.id))) {
    rows.set(item.id, {
      menuItemId: item.id,
      name: item.name,
      verified: 0,
      pending: 0,
      unit: asPriceUnit(item.priceUnit),
      sizeNote: item.sizeNote,
      noted: false,
      pendingNoted: false,
      who: [],
      baked: false,
    })
  }
  for (const order of orders) {
    const verified = isVerified(order.status)
    for (const line of order.items) {
      const row = rows.get(line.menuItemId)
      if (!row) continue
      if (verified) row.verified += line.quantity
      else row.pending += line.quantity
      if (verified && !line.bakedAt) unbaked.add(row.menuItemId)
      if (order.customerNote && verified) row.noted = true
      if (order.customerNote && !verified) row.pendingNoted = true
      if (!row.who.some((who) => who.code === order.code)) row.who.push({ name: firstName(order.customerName), code: order.code, pending: !verified })
    }
  }
  for (const row of rows.values()) row.baked = row.verified > 0 && !unbaked.has(row.menuItemId)

  // Made to order: each line of an item that bakes separately, with its order's note, in pickup order.
  const sizeOf = new Map(catalogue.map((item) => [item.id, item.sizeNote]))
  const made: MadeRow[] = [...orders]
    .sort((a, b) => (a.pickupTime ?? "99:99").localeCompare(b.pickupTime ?? "99:99"))
    .flatMap((order) =>
      order.items
        .filter((line) => separate.has(line.menuItemId))
        .map((line) => ({
          lineId: line.id,
          quantity: line.quantity,
          name: line.name,
          sizeNote: sizeOf.get(line.menuItemId) ?? null,
          customer: order.customerName,
          code: order.code,
          note: order.customerNote,
          allergen: order.customerNote ? mentionsAllergen(order.customerNote) : false,
          pending: !isVerified(order.status),
          baked: Boolean(line.bakedAt),
        })),
    )

  const categoryOf = new Map(catalogue.map((item) => [item.id, item.category]))
  const categoryRank = new Map(categories.map((category, index) => [category.slug, index]))
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
      time: clock(order.time),
      delivery: order.delivery,
      text: order.note ?? "",
      allergen: order.allergen,
      pending: order.pending,
    }))
    .sort((a, b) => Number(b.allergen) - Number(a.allergen))

  const rankOf = (category: string | null) => categoryRank.get(category ?? "") ?? categories.length
  const counter: CounterRow[] = [...(day?.items ?? [])]
    .sort((a, b) => rankOf(a.menuItem.category) - rankOf(b.menuItem.category) || a.menuItem.name.localeCompare(b.menuItem.name))
    .map((row) => ({
      tickId: row.id,
      name: row.menuItem.name,
      quantity: row.quantityAvailable,
      unit: asPriceUnit(row.menuItem.priceUnit),
      sizeNote: row.menuItem.sizeNote,
      baked: Boolean(row.bakedAt),
    }))

  const verifiedOrders = orders.filter((order) => isVerified(order.status))
  const times = verifiedOrders
    .filter((order) => order.fulfilmentType === FulfilmentType.PICKUP && order.pickupTime)
    .map((order) => order.pickupTime as string)
    .sort()

  const closed = Boolean(day && !day.isOpen)
  const beyond = date > addDays(today, settings.orderAheadDays)
  // Counter-items alone make a sheet — on an open day within reach.
  const state: SheetState =
    orders.length > 0 || (counter.length > 0 && !closed && !beyond) ? null : closed ? "closed" : beyond ? "beyond" : "empty"

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
    firstTime: clock(times[0] ?? null),
    lastTime: clock(times.at(-1) ?? null),
    bake,
    made,
    counter,
    counterPieces: counter.reduce((sum, row) => sum + row.quantity, 0),
    notes,
    orders: sheetOrders,
    version: versionOf(orders, [
      ...(day?.items ?? []).filter((row) => row.bakedAt).map((row) => row.id),
      ...orders.flatMap((order) => order.items.filter((line) => line.bakedAt).map((line) => line.id)),
    ]),
    bakeryName: settings.bakeryName,
    asOf: `${formatDayLabel(isoDateInZone(now, tz))}, ${formatClock(formatTimeIn(now, tz))}`,
  }
}
