import { FulfilmentType, OrderStatus } from "@/generated/prisma/client"
import { addDays, fromDbDate, type IsoDate, todayIn, toDbDate } from "@/lib/dates"
import { OrderError, prisma, serializable } from "@/lib/db"
import { loadBookingWindow, newMenuDay } from "@/lib/orders/booking"
import { deadlineFor, earliestDate, longestNotice, pastCutoff } from "@/lib/orders/deadline"
import { LIVE_STATUSES, VERIFIED_STATUSES } from "@/lib/orders/status"

/** Already validated and normalised — the server action's zod schema produces exactly this. */
export type PlaceOrderInput = {
  /** A uuid generated once per checkout attempt. A double-tap resends the same one. */
  idempotencyKey: string
  fulfilmentDate: IsoDate
  fulfilmentType: FulfilmentType
  name: string
  /** E.164 — normalised before it gets here. */
  phoneE164: string
  address: string | null
  pickupTime: string | null
  note: string | null
  /** One line per menu item — the action merges duplicates. Prices are never accepted from the client. */
  items: { menuItemId: string; quantity: number }[]
}

export type PlacedOrder = {
  id: string
  code: string
  /** False when the idempotency key matched an earlier order: nothing was created, nothing should notify. */
  created: boolean
  status: OrderStatus
  isSuspected: boolean
  autoVerified: boolean
  fulfilmentDate: IsoDate
  fulfilmentType: FulfilmentType
  customerName: string
  customerPhone: string
  /** Orders this customer has collected before — "Ordered before (n)". */
  previousOrders: number
  items: { name: string; quantity: number; lineTotalPaise: number }[]
  totalPaise: number
  customerNote: string | null
  pendingCount: number
  maxOrders: number
  telegramChatId: string | null
  timezone: string
}

type LockedDay = {
  id: string
  isOpen: boolean
  cutoffAt: Date
  cutoffTime: string
  cutoffDaysBefore: number
  maxOrders: number
  overbookLimit: number
}

async function replay(idempotencyKey: string): Promise<PlacedOrder | null> {
  const order = await prisma.order.findUnique({
    where: { idempotencyKey },
    include: { items: true, customer: { select: { completedCount: true } }, menuDay: { select: { maxOrders: true } } },
  })
  if (!order) return null
  const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 }, select: { telegramChatId: true, timezone: true } })
  return {
    id: order.id,
    code: order.code,
    created: false,
    status: order.status,
    isSuspected: order.isSuspected,
    autoVerified: false,
    fulfilmentDate: fromDbDate(order.fulfilmentDate),
    fulfilmentType: order.fulfilmentType,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    previousOrders: order.customer.completedCount,
    items: order.items.map((item) => ({ name: item.name, quantity: item.quantity, lineTotalPaise: item.lineTotalPaise })),
    totalPaise: order.totalPaise,
    customerNote: order.customerNote,
    pendingCount: 0,
    maxOrders: order.menuDay.maxOrders,
    telegramChatId: settings.telegramChatId,
    timezone: settings.timezone,
  }
}

/**
 * dev-docs/implementation.md Step 7.1, as 7R reworked it — the whole order in ONE serializable transaction. The database
 * write IS the order: notifying the owner happens after commit (notify.ts), and never rolls it back. Refusals throw
 * OrderError; the action maps them to what the customer sees.
 *
 * Every online order is an order-ahead order: any orderable menu item, for a date in the booking window at least its
 * notice away (the deadline rule, deadline.ts). Orders don't draw down a day's items — those are its counter-items.
 *
 * `now` is injectable for scripts and tests (placing "yesterday" an order for today); the action never passes it.
 */
export async function placeOrder(input: PlaceOrderInput, { now = new Date() }: { now?: Date } = {}): Promise<PlacedOrder> {
  const placed = await serializable(async (tx): Promise<PlacedOrder | null> => {
    // 1. Idempotency — an existing key returns the original order and creates nothing.
    const existing = await tx.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true } })
    if (existing) return null

    // 2. Kill switch, and the ways the bakery hands orders over.
    const settings = await tx.settings.findUniqueOrThrow({ where: { id: 1 } })
    if (settings.orderingPaused) throw new OrderError("ORDERING_PAUSED", { reason: settings.orderingPausedReason })
    if (input.fulfilmentType === FulfilmentType.PICKUP && !settings.pickupEnabled) throw new OrderError("FULFILMENT_UNAVAILABLE")
    if (input.fulfilmentType === FulfilmentType.DELIVERY && (!settings.deliveryEnabled || !input.address)) {
      throw new OrderError("FULFILMENT_UNAVAILABLE")
    }

    // 3. The booking window: today … today + orderAheadDays. A date gone by closed long ago.
    const date = input.fulfilmentDate
    const today = todayIn(settings.timezone, now)
    if (date < today) throw new OrderError("CUTOFF_PASSED", { date })
    if (date > addDays(today, settings.orderAheadDays)) throw new OrderError("DAY_CLOSED", { date })

    // 4. Every line an orderable menu item, priced SERVER-SIDE from the menu — the cart's prices are display-only.
    const items = await tx.menuItem.findMany({
      where: { id: { in: input.items.map((item) => item.menuItemId) } },
      select: { id: true, name: true, basePricePaise: true, isActive: true, archivedAt: true, orderable: true, noticeDays: true },
    })
    const byId = new Map(items.map((item) => [item.id, item]))
    const lines = input.items.map((item) => {
      const row = byId.get(item.menuItemId)
      if (!row || !row.isActive || row.archivedAt || !row.orderable) {
        throw new OrderError("ITEM_UNAVAILABLE", { menuItemId: item.menuItemId, name: row?.name ?? null })
      }
      const unitPricePaise = row.basePricePaise
      return {
        menuItemId: row.id,
        name: row.name,
        noticeDays: row.noticeDays,
        unitPricePaise,
        quantity: item.quantity,
        lineTotalPaise: unitPricePaise * item.quantity,
      }
    })
    const subtotalPaise = lines.reduce((sum, line) => sum + line.lineTotalPaise, 0)
    const deliveryFeePaise = input.fulfilmentType === FulfilmentType.DELIVERY ? settings.deliveryFeePaise : 0

    // 5. LOCK the day — created from the defaults when nobody planned it yet (the order needs it, and its limits come with it).
    await tx.menuDay.createMany({ data: [newMenuDay(date, settings)], skipDuplicates: true })
    const [day] = await tx.$queryRaw<LockedDay[]>`
      SELECT id, "isOpen", "cutoffAt", "cutoffTime", "cutoffDaysBefore", "maxOrders", "overbookLimit"
      FROM menu_days WHERE date = ${toDbDate(date)} FOR UPDATE`

    // 6. Open, before the day's own cutoff, and before the deadline the lines' notice sets.
    if (!day.isOpen) throw new OrderError("DAY_CLOSED", { date })
    if (pastCutoff({ cutoffAt: day.cutoffAt.getTime() }, now.getTime())) throw new OrderError("CUTOFF_PASSED", { date })
    const notices = lines.map((line) => line.noticeDays)
    const rule = { date, cutoffAt: day.cutoffAt.getTime(), cutoffTime: day.cutoffTime, cutoffDaysBefore: day.cutoffDaysBefore }
    if (deadlineFor(rule, notices, settings.timezone) <= now.getTime()) {
      const longest = longestNotice(lines)
      const window = await loadBookingWindow(settings, now, tx)
      throw new OrderError("TOO_SOON", {
        date,
        menuItemId: longest?.menuItemId,
        name: longest?.name,
        notice: longest?.noticeDays,
        earliest: earliestDate(notices, window),
      })
    }

    // 7. Overbook limit — every order still alive counts.
    const liveCount = await tx.order.count({ where: { menuDayId: day.id, status: { in: [...LIVE_STATUSES] } } })
    if (liveCount >= day.overbookLimit) throw new OrderError("DAY_FULL", { date })

    // 8. Upsert the customer by phone. A blocked number is accepted and flagged — it sees nothing different.
    const customer = await tx.customer.upsert({
      where: { phoneE164: input.phoneE164 },
      create: { phoneE164: input.phoneE164, name: input.name, address: input.address, orderCount: 1, firstOrderAt: now, lastOrderAt: now },
      update: { orderCount: { increment: 1 }, lastOrderAt: now, ...(input.address ? { address: input.address } : {}) },
    })

    // 9. The code read aloud on the phone and written on the bag.
    const [{ n }] = await tx.$queryRaw<{ n: bigint }[]>`SELECT nextval('order_code_seq') AS n`
    const code = `BK-${n}`

    // 10. Auto-verify a trusted customer while the day has verified room.
    let autoVerified = false
    if (settings.autoVerifyTrusted && customer.isTrusted && !customer.isBlocked) {
      const verifiedCount = await tx.order.count({ where: { menuDayId: day.id, status: { in: [...VERIFIED_STATUSES] } } })
      autoVerified = verifiedCount < day.maxOrders
    }

    // 11. Insert, snapshotting names and prices.
    const order = await tx.order.create({
      data: {
        code,
        idempotencyKey: input.idempotencyKey,
        customerId: customer.id,
        menuDayId: day.id,
        fulfilmentDate: toDbDate(date),
        status: autoVerified ? OrderStatus.VERIFIED : OrderStatus.PENDING,
        verifiedAt: autoVerified ? now : null,
        fulfilmentType: input.fulfilmentType,
        customerName: input.name,
        customerPhone: input.phoneE164,
        deliveryAddress: input.fulfilmentType === FulfilmentType.DELIVERY ? input.address : null,
        pickupTime: input.fulfilmentType === FulfilmentType.PICKUP ? input.pickupTime : null,
        subtotalPaise,
        deliveryFeePaise,
        totalPaise: subtotalPaise + deliveryFeePaise,
        customerNote: input.note,
        isSuspected: customer.isBlocked,
        items: {
          create: lines.map((line) => ({
            menuItemId: line.menuItemId,
            name: line.name,
            unitPricePaise: line.unitPricePaise,
            quantity: line.quantity,
            lineTotalPaise: line.lineTotalPaise,
          })),
        },
      },
      select: { id: true, status: true },
    })

    const pendingCount = await tx.order.count({ where: { menuDayId: day.id, status: OrderStatus.PENDING } })

    return {
      id: order.id,
      code,
      created: true,
      status: order.status,
      isSuspected: customer.isBlocked,
      autoVerified,
      fulfilmentDate: date,
      fulfilmentType: input.fulfilmentType,
      customerName: input.name,
      customerPhone: input.phoneE164,
      previousOrders: customer.completedCount,
      items: lines.map(({ name, quantity, lineTotalPaise }) => ({ name, quantity, lineTotalPaise })),
      totalPaise: subtotalPaise + deliveryFeePaise,
      customerNote: input.note,
      pendingCount,
      maxOrders: day.maxOrders,
      telegramChatId: settings.telegramChatId,
      timezone: settings.timezone,
    }
  })

  if (placed) return placed
  // A replay: the original order, read outside the transaction.
  const original = await replay(input.idempotencyKey)
  if (!original) throw new Error(`Idempotency key ${input.idempotencyKey} matched an order that no longer exists`)
  return original
}
