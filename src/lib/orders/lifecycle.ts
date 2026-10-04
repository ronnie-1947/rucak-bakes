import { OrderStatus } from "@/generated/prisma/client"
import { fromDbDate } from "@/lib/dates"
import { OrderError, readCommitted, serializable, type Tx } from "@/lib/db"
import { canTransition, VERIFIED_STATUSES } from "@/lib/orders/status"

/**
 * Every write that changes an order's status. Each runs in one transaction; the ones that change what counts against the
 * day's limits (verify, cancel, no-show) take the day's row lock first — the lock placeOrder holds while it counts.
 * verifyOrder counts under that lock as placeOrder does, so it runs at READ COMMITTED like placeOrder (db.ts,
 * readCommitted); the rest stay serializable().
 *
 * Orders don't draw down a day's items (§10R): nothing here touches MenuDayItem.quantityOrdered.
 */

/** Without this lock two staff tapping Verify at once both read 9 and the bakery bakes eleven orders. */
export async function lockMenuDay(tx: Tx, menuDayId: string) {
  await tx.$queryRaw`SELECT id FROM menu_days WHERE id = ${menuDayId} FOR UPDATE`
}

function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransition(from, to)) throw new OrderError("INVALID_TRANSITION", { from, to })
}

async function loadOrder(tx: Tx, orderId: string) {
  return tx.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { id: true, status: true, menuDayId: true, customerId: true, totalPaise: true, fulfilmentDate: true, readyAt: true, completedAt: true },
  })
}

/**
 * PENDING → VERIFIED, against the day's maxOrders. Over capacity it throws CAPACITY_EXCEEDED (with the
 * numbers the confirm dialog names) unless `force` — the owner chose to take one more.
 */
export async function verifyOrder(orderId: string, staffId: string, force = false) {
  return readCommitted(async (tx) => {
    const { menuDayId } = await tx.order.findUniqueOrThrow({ where: { id: orderId }, select: { menuDayId: true } })
    await lockMenuDay(tx, menuDayId)
    // Read after the lock: at READ COMMITTED this sees a verify or cancel that finished while we waited.
    const order = await loadOrder(tx, orderId)
    assertTransition(order.status, OrderStatus.VERIFIED)

    const day = await tx.menuDay.findUniqueOrThrow({ where: { id: order.menuDayId }, select: { maxOrders: true } })
    const verifiedCount = await tx.order.count({ where: { menuDayId: order.menuDayId, status: { in: [...VERIFIED_STATUSES] } } })
    if (verifiedCount >= day.maxOrders && !force) {
      throw new OrderError("CAPACITY_EXCEEDED", { verifiedCount, maxOrders: day.maxOrders, date: fromDbDate(order.fulfilmentDate) })
    }

    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.VERIFIED, verifiedAt: new Date(), verifiedById: staffId } })
  })
}

/** PENDING | VERIFIED → CANCELLED. The order stops counting against the day, so its slot resells. */
export async function cancelOrder(orderId: string, staffId: string, note: string | null) {
  return serializable(async (tx) => {
    const order = await loadOrder(tx, orderId)
    assertTransition(order.status, OrderStatus.CANCELLED)
    await lockMenuDay(tx, order.menuDayId)
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date(), cancelledById: staffId, cancellationNote: note },
    })
  })
}

/**
 * READY → NO_SHOW. Counts against the customer, and the order stops counting against the day. The schema has one "closed
 * unfulfilled" trail, so `cancelledAt` / `cancelledById` / `cancellationNote` record when, by whom and
 * why — `status` says which of the two it was.
 */
export async function markNoShow(orderId: string, staffId: string, note: string | null) {
  return serializable(async (tx) => {
    const order = await loadOrder(tx, orderId)
    assertTransition(order.status, OrderStatus.NO_SHOW)
    await lockMenuDay(tx, order.menuDayId)
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.NO_SHOW, cancelledAt: new Date(), cancelledById: staffId, cancellationNote: note },
    })
    await tx.customer.update({ where: { id: order.customerId }, data: { noShowCount: { increment: 1 } } })
  })
}

/** VERIFIED → READY. */
export async function markReady(orderId: string) {
  return serializable(async (tx) => {
    const order = await loadOrder(tx, orderId)
    assertTransition(order.status, OrderStatus.READY)
    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.READY, readyAt: new Date() } })
  })
}

/** READY → COMPLETED. The customer's counters move here — never at VERIFIED. */
export async function markCompleted(orderId: string) {
  return serializable(async (tx) => {
    const order = await loadOrder(tx, orderId)
    assertTransition(order.status, OrderStatus.COMPLETED)
    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.COMPLETED, completedAt: new Date() } })
    await tx.customer.update({
      where: { id: order.customerId },
      data: { completedCount: { increment: 1 }, totalSpentPaise: { increment: order.totalPaise } },
    })
  })
}

/**
 * The day sheet's Collected tick: VERIFIED | READY → COMPLETED in one step. The counter hands the bag over
 * without marking it ready first, so a VERIFIED order passes through READY at the same instant — `readyAt`
 * equal to `completedAt` is how undoCollected knows to put it back to VERIFIED.
 */
export async function markCollected(orderId: string) {
  return serializable(async (tx) => {
    const order = await loadOrder(tx, orderId)
    if (order.status !== OrderStatus.VERIFIED && order.status !== OrderStatus.READY) {
      throw new OrderError("INVALID_TRANSITION", { from: order.status, to: OrderStatus.COMPLETED })
    }
    const now = new Date()
    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.COMPLETED, completedAt: now, readyAt: order.readyAt ?? now } })
    await tx.customer.update({
      where: { id: order.customerId },
      data: { completedCount: { increment: 1 }, totalSpentPaise: { increment: order.totalPaise } },
    })
  })
}

/**
 * Unticking Collected on the day sheet — a mis-tap at the counter. The one way out of COMPLETED, and the
 * caller only offers it on the order's own day or before: the order goes back to READY (or VERIFIED, if
 * markCollected skipped READY) and the customer's counters move back with it.
 */
export async function undoCollected(orderId: string) {
  return serializable(async (tx) => {
    const order = await loadOrder(tx, orderId)
    if (order.status !== OrderStatus.COMPLETED) throw new OrderError("INVALID_TRANSITION", { from: order.status, to: OrderStatus.READY })
    const skippedReady = order.readyAt !== null && order.completedAt !== null && order.readyAt.getTime() === order.completedAt.getTime()
    await tx.order.update({
      where: { id: orderId },
      data: skippedReady
        ? { status: OrderStatus.VERIFIED, completedAt: null, readyAt: null }
        : { status: OrderStatus.READY, completedAt: null },
    })
    await tx.customer.update({
      where: { id: order.customerId },
      data: { completedCount: { decrement: 1 }, totalSpentPaise: { decrement: order.totalPaise } },
    })
  })
}
