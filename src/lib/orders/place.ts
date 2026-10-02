import { FulfilmentType, OrderStatus, Prisma } from "@/generated/prisma/client"
import { addDays, fromDbDate, type IsoDate, todayIn, toDbDate } from "@/lib/dates"
import { OrderError, prisma, serializable } from "@/lib/db"
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

type LockedDay = { id: string; isOpen: boolean; cutoffAt: Date; maxOrders: number; overbookLimit: number }
type LockedItem = {
  menuItemId: string
  quantityAvailable: number
  quantityOrdered: number
  priceOverridePaise: number | null
  name: string
  basePricePaise: number
  isActive: boolean
  archivedAt: Date | null
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
 * dev-docs/implementation.md Step 7.1 — the whole order in ONE serializable transaction. The database
 * write IS the order: notifying the owner happens after commit (notify.ts), and never rolls it back.
 * Refusals throw OrderError; the action maps them to what the customer sees.
 *
 * `now` is injectable for scripts and tests (placing "yesterday" an order for today); the action never passes it.
 */
export async function placeOrder(input: PlaceOrderInput, { now = new Date() }: { now?: Date } = {}): Promise<PlacedOrder> {
  const placed = await serializable(async (tx): Promise<PlacedOrder | null> => {
    // 1. Idempotency — an existing key returns the original order and creates nothing.
    const existing = await tx.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true } })
    if (existing) return null

    // 2. Kill switch.
    const settings = await tx.settings.findUniqueOrThrow({ where: { id: 1 } })
    if (settings.orderingPaused) throw new OrderError("ORDERING_PAUSED", { reason: settings.orderingPausedReason })
    if (input.fulfilmentType === FulfilmentType.PICKUP && !settings.pickupEnabled) throw new OrderError("FULFILMENT_UNAVAILABLE")
    if (input.fulfilmentType === FulfilmentType.DELIVERY && (!settings.deliveryEnabled || !input.address)) {
      throw new OrderError("FULFILMENT_UNAVAILABLE")
    }
    const today = todayIn(settings.timezone, now)

    // 3. LOCK the day.
    const [day] = await tx.$queryRaw<LockedDay[]>`
      SELECT id, "isOpen", "cutoffAt", "maxOrders", "overbookLimit"
      FROM menu_days WHERE date = ${toDbDate(input.fulfilmentDate)} FOR UPDATE`
    // 4. Open, and before cutoff. A day too far ahead is closed for ordering.
    const tooFar = input.fulfilmentDate > addDays(today, settings.orderAheadDays)
    if (!day || !day.isOpen || tooFar) throw new OrderError("DAY_CLOSED", { date: input.fulfilmentDate })
    if (day.cutoffAt.getTime() <= now.getTime()) throw new OrderError("CUTOFF_PASSED", { date: input.fulfilmentDate })

    // 5. Overbook limit — every order still alive counts.
    const liveCount = await tx.order.count({ where: { menuDayId: day.id, status: { in: [...LIVE_STATUSES] } } })
    if (liveCount >= day.overbookLimit) throw new OrderError("DAY_FULL", { date: input.fulfilmentDate })

    // 6. LOCK the requested items and check what's left.
    const ids = input.items.map((item) => item.menuItemId)
    const rows = await tx.$queryRaw<LockedItem[]>`
      SELECT mdi."menuItemId", mdi."quantityAvailable", mdi."quantityOrdered", mdi."priceOverridePaise",
             mi.name, mi."basePricePaise", mi."isActive", mi."archivedAt"
      FROM menu_day_items mdi JOIN menu_items mi ON mi.id = mdi."menuItemId"
      WHERE mdi."menuDayId" = ${day.id} AND mdi."menuItemId" IN (${Prisma.join(ids)})
      FOR UPDATE OF mdi`
    const byId = new Map(rows.map((row) => [row.menuItemId, row]))

    // 7. Price SERVER-SIDE — the cart's prices are display-only.
    const lines = input.items.map((item) => {
      const row = byId.get(item.menuItemId)
      const remaining = row ? row.quantityAvailable - row.quantityOrdered : 0
      if (!row || !row.isActive || row.archivedAt || remaining < item.quantity) {
        throw new OrderError("ITEM_UNAVAILABLE", { menuItemId: item.menuItemId, name: row?.name ?? null, remaining: Math.max(0, remaining) })
      }
      const unitPricePaise = row.priceOverridePaise ?? row.basePricePaise
      return { menuItemId: item.menuItemId, name: row.name, unitPricePaise, quantity: item.quantity, lineTotalPaise: unitPricePaise * item.quantity }
    })
    const subtotalPaise = lines.reduce((sum, line) => sum + line.lineTotalPaise, 0)
    const deliveryFeePaise = input.fulfilmentType === FulfilmentType.DELIVERY ? settings.deliveryFeePaise : 0

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

    // 11. Insert, snapshotting names and prices, and take the quantities.
    const order = await tx.order.create({
      data: {
        code,
        idempotencyKey: input.idempotencyKey,
        customerId: customer.id,
        menuDayId: day.id,
        fulfilmentDate: toDbDate(input.fulfilmentDate),
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
        items: { create: lines },
      },
      select: { id: true, status: true },
    })
    for (const line of lines) {
      await tx.menuDayItem.update({
        where: { menuDayId_menuItemId: { menuDayId: day.id, menuItemId: line.menuItemId } },
        data: { quantityOrdered: { increment: line.quantity } },
      })
    }

    const pendingCount = await tx.order.count({ where: { menuDayId: day.id, status: OrderStatus.PENDING } })

    return {
      id: order.id,
      code,
      created: true,
      status: order.status,
      isSuspected: customer.isBlocked,
      autoVerified,
      fulfilmentDate: input.fulfilmentDate,
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
