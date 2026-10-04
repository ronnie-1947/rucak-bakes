import { formatTimeIn, type IsoDate, isoDateInZone } from "@/lib/dates"
import type { DayStatus } from "./types"

/**
 * How a fulfilment day stands for customers, judged the way `placeOrder` will judge the submit
 * (src/lib/orders/place.ts), in its order: paused › closed › past cutoff › full › open. Shared by every
 * customer read model so the landing page and the item page can never disagree. Client-safe.
 */
export function dayStatus(day: { isOpen: boolean; cutoffAt: Date; overbookLimit: number } | null, taken: number, paused: boolean, now: Date): DayStatus {
  if (paused) return "paused"
  if (!day) return "unplanned"
  if (!day.isOpen) return "closed"
  if (day.cutoffAt.getTime() <= now.getTime()) return "cutoff"
  if (taken >= day.overbookLimit) return "full"
  return "open"
}

/** When ordering for a day closes, bakery-local: its date and "18:00". */
export function dayCutoff(cutoffAt: Date, timeZone: string): { date: IsoDate; time: string } {
  return { date: isoDateInZone(cutoffAt, timeZone), time: formatTimeIn(cutoffAt, timeZone) }
}
