import { OrderStatus } from "@/generated/prisma/client"
import { fromDbDate, todayIn } from "@/lib/dates"
import { OrderError, prisma } from "@/lib/db"
import { markCollected, undoCollected } from "@/lib/orders/lifecycle"
import { getSettings } from "@/lib/settings"

/**
 * The day sheet's two ticks. Both persist — the baker and the counter are different people on different
 * devices — and both are idempotent: asking for the state a row is already in succeeds without writing,
 * so two devices ticking the same row never fight. A past day is read-only.
 */

export type TickOutcome = { ok: true } | { ok: false; reason: "PAST" | "STALE" }

const PAST: TickOutcome = { ok: false, reason: "PAST" }
const STALE: TickOutcome = { ok: false, reason: "STALE" }

async function isPast(date: Date): Promise<boolean> {
  const settings = await getSettings()
  return fromDbDate(date) < todayIn(settings.timezone)
}

/** Baked: `MenuDayItem.bakedAt` set to now, or cleared. */
export async function setBaked(menuDayItemId: string, done: boolean): Promise<TickOutcome> {
  const row = await prisma.menuDayItem.findUnique({ where: { id: menuDayItemId }, select: { bakedAt: true, menuDay: { select: { date: true } } } })
  if (!row) return STALE
  if (await isPast(row.menuDay.date)) return PAST
  if (Boolean(row.bakedAt) === done) return { ok: true }
  await prisma.menuDayItem.update({ where: { id: menuDayItemId }, data: { bakedAt: done ? new Date() : null } })
  return { ok: true }
}

/** Collected: the order to COMPLETED (customer counters move), or back out of it. */
export async function setCollected(orderId: string, done: boolean): Promise<TickOutcome> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, fulfilmentDate: true } })
  if (!order) return STALE
  if (await isPast(order.fulfilmentDate)) return PAST
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
