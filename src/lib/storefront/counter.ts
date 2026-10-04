import { type IsoDate, toDbDate, weekday } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { parseOpeningHours, weekdayKey } from "@/lib/settings/hours"

/**
 * Today's counter (§10R) — the counter-items baked for the counter, which customers walk in for and can't order online.
 * Shared by the landing page's Fresh today and the item page's "On the counter today". Server.
 */

export type CounterLine = {
  menuItemId: string
  /** The counter's price for the day: the override, else null for the base price. */
  priceOverridePaise: number | null
  soldOut: boolean
}

/** When the counter closes on `date`, "16:00" — that weekday's opening hours. Null until the hours are saved, or on a closed weekday. */
export function counterCloses(openingHours: unknown, date: IsoDate): string | null {
  const hours = parseOpeningHours(openingHours)?.[weekdayKey(weekday(date))]
  return hours?.open ? hours.to : null
}

/** The counter-items planned for `date` — none when the day isn't planned or is closed. */
export async function counterLines(date: IsoDate): Promise<CounterLine[]> {
  const day = await prisma.menuDay.findUnique({
    where: { date: toDbDate(date) },
    select: { isOpen: true, items: { select: { menuItemId: true, priceOverridePaise: true, soldOutAt: true } } },
  })
  if (!day?.isOpen) return []
  return day.items.map((line) => ({ menuItemId: line.menuItemId, priceOverridePaise: line.priceOverridePaise, soldOut: line.soldOutAt !== null }))
}
