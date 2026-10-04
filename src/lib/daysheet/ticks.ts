import { OrderStatus } from "@/generated/prisma/client"
import { fromDbDate, type IsoDate, todayIn, toDbDate } from "@/lib/dates"
import { OrderError, prisma } from "@/lib/db"
import { markCollected, undoCollected } from "@/lib/orders/lifecycle"
import { VERIFIED_STATUSES } from "@/lib/orders/status"
import { getSettings } from "@/lib/settings/row"

/**
 * The day sheet's ticks. Every one persists — the baker and the counter are different people on different
 * devices — and every one is idempotent: asking for the state a row is already in succeeds without writing,
 * so two devices ticking the same row never fight. A past day is read-only.
 */

export type TickOutcome = { ok: true } | { ok: false; reason: "PAST" | "STALE" }

const PAST: TickOutcome = { ok: false, reason: "PAST" }
const STALE: TickOutcome = { ok: false, reason: "STALE" }

async function isPast(date: IsoDate): Promise<boolean> {
  const settings = await getSettings()
  return date < todayIn(settings.timezone)
}

/**
 * A For orders row: `OrderItem.bakedAt` on every verified line of the item that day. A line that arrives later starts
 * unbaked, so the row un-ticks — the new units still need baking.
 */
export async function setItemBaked(date: IsoDate, menuItemId: string, done: boolean): Promise<TickOutcome> {
  if (await isPast(date)) return PAST
  const where = { menuItemId, order: { fulfilmentDate: toDbDate(date), status: { in: [...VERIFIED_STATUSES] } } }
  if ((await prisma.orderItem.count({ where })) === 0) return STALE
  await prisma.orderItem.updateMany({ where: { ...where, bakedAt: done ? null : { not: null } }, data: { bakedAt: done ? new Date() : null } })
  return { ok: true }
}

/** A Made to order row: that one line. Only a verified order's line can be ticked. */
export async function setLineBaked(orderItemId: string, done: boolean): Promise<TickOutcome> {
  const line = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    select: { bakedAt: true, order: { select: { status: true, fulfilmentDate: true } } },
  })
  if (!line || !VERIFIED_STATUSES.includes(line.order.status)) return STALE
  if (await isPast(fromDbDate(line.order.fulfilmentDate))) return PAST
  if (Boolean(line.bakedAt) === done) return { ok: true }
  await prisma.orderItem.update({ where: { id: orderItemId }, data: { bakedAt: done ? new Date() : null } })
  return { ok: true }
}

/** A counter-item: `MenuDayItem.bakedAt` set to now, or cleared. */
export async function setCounterBaked(menuDayItemId: string, done: boolean): Promise<TickOutcome> {
  const row = await prisma.menuDayItem.findUnique({ where: { id: menuDayItemId }, select: { bakedAt: true, menuDay: { select: { date: true } } } })
  if (!row) return STALE
  if (await isPast(fromDbDate(row.menuDay.date))) return PAST
  if (Boolean(row.bakedAt) === done) return { ok: true }
  await prisma.menuDayItem.update({ where: { id: menuDayItemId }, data: { bakedAt: done ? new Date() : null } })
  return { ok: true }
}

/** Collected: the order to COMPLETED (customer counters move), or back out of it. */
export async function setCollected(orderId: string, done: boolean): Promise<TickOutcome> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, fulfilmentDate: true } })
  if (!order) return STALE
  if (await isPast(fromDbDate(order.fulfilmentDate))) return PAST
  if ((order.status === OrderStatus.COMPLETED) === done) return { ok: true }
  try {
    if (done) await markCollected(orderId)
    else await undoCollected(orderId)
  } catch (error) {
    // Pending, cancelled or no-show by now — someone changed it on the Orders screen.
    if (error instanceof OrderError) return STALE
    throw error
  }
  return { ok: true }
}
