import { OrderStatus } from "@/generated/prisma/client"
import { fromDbDate } from "@/lib/dates"
import { OrderError, serializable, type Tx } from "@/lib/db"
import { canTransition, VERIFIED_STATUSES } from "@/lib/orders/status"

/**
 * Every write that changes an order's status. Each runs in one serializable() transaction and takes
 * the day's row lock FIRST — the same order createOrder takes its locks in (day, then items), so a
 * cancel releasing quantities can never deadlock against a customer placing an order.
 */

/** Without this lock two staff tapping Verify at once both read 9 and the bakery bakes eleven orders. */
export async function lockMenuDay(tx: Tx, menuDayId: string) {
  await tx.$queryRaw`SELECT id FROM menu_days WHERE id = ${menuDayId} FOR UPDATE`
}

function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransition(from, to)) throw new OrderError("INVALID_TRANSITION", { from, to })
}

/** Puts every line of the order back on sale for its day. Caller holds the day lock. */
async function releaseQuantities(tx: Tx, orderId: string, menuDayId: string) {
  const lines = await tx.orderItem.findMany({ where: { orderId }, select: { menuItemId: true, quantity: true } })
  for (const line of lines) {
    // updateMany: the item may since have been taken off the day, and then there is nothing to release.
    await tx.menuDayItem.updateMany({
      where: { menuDayId, menuItemId: line.menuItemId, quantityOrdered: { gte: line.quantity } },
      data: { quantityOrdered: { decrement: line.quantity } },
    })
  }
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
  return serializable(async (tx) => {
    const order = await loadOrder(tx, orderId)
    assertTransition(order.status, OrderStatus.VERIFIED)

    await lockMenuDay(tx, order.menuDayId)
    const day = await tx.menuDay.findUniqueOrThrow({ where: { id: order.menuDayId }, select: { maxOrders: true } })
    const verifiedCount = await tx.order.count({ where: { menuDayId: order.menuDayId, status: { in: [...VERIFIED_STATUSES] } } })
    if (verifiedCount >= day.maxOrders && !force) {
      throw new OrderError("CAPACITY_EXCEEDED", { verifiedCount, maxOrders: day.maxOrders, date: fromDbDate(order.fulfilmentDate) })
    }

    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.VERIFIED, verifiedAt: new Date(), verifiedById: staffId } })
  })
}

/** PENDING | VERIFIED → CANCELLED. Releases the order's quantities so the slots resell. */
export async function cancelOrder(orderId: string, staffId: string, note: string | null) {
  return serializable(async (tx) => {
    const order = await loadOrder(tx, orderId)
    assertTransition(order.status, OrderStatus.CANCELLED)
    await lockMenuDay(tx, order.menuDayId)
    await releaseQuantities(tx, orderId, order.menuDayId)
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date(), cancelledById: staffId, cancellationNote: note },
    })
  })
}

/**
 * READY → NO_SHOW. Counts against the customer and releases quantities. The schema has one "closed
 * unfulfilled" trail, so `cancelledAt` / `cancelledById` / `cancellationNote` record when, by whom and
 * why — `status` says which of the two it was.
 */
export async function markNoShow(orderId: string, staffId: string, note: string | null) {
  return serializable(async (tx) => {
    const order = await loadOrder(tx, orderId)
    assertTransition(order.status, OrderStatus.NO_SHOW)
    await lockMenuDay(tx, order.menuDayId)
    await releaseQuantities(tx, orderId, order.menuDayId)
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
