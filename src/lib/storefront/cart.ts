import { connection } from "next/server"
import { addDays, dateRange, fromDbDate, type IsoDate, todayIn, toDbDate } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { LIVE_STATUSES } from "@/lib/orders/status"
import type { CartCheck } from "@/lib/cart/check"
import { type OpeningHours, parseOpeningHours } from "@/lib/settings/hours"
import { getSettings } from "@/lib/settings/row"
import { dayCutoff, dayStatus } from "./status"
import type { DayStatus } from "./types"

/**
 * Read models for the cart (/cart). The cart itself lives in the browser, so the page gets what doesn't depend
 * on it — the order-ahead window's days, how the bakery hands orders over — and `checkCart` (actions/checkout.ts)
 * checks the cart's own lines against the live menu once the browser has read them.
 */

/** One fulfilment day the cart can be for — the day card and the Change day list. */
export type CartDay = {
  date: IsoDate
  status: DayStatus
  /** Orders the day still accepts: overbookLimit − live orders, never below 0. */
  left: number
  /** overbookLimit. */
  capacity: number
  /** Null when there's no MenuDay. */
  cutoff: { date: IsoDate; time: string } | null
}

export type CartPageData = {
  today: IsoDate
  /** Every planned day from today to the end of the order-ahead window, closed ones included. */
  days: CartDay[]
  pickup: {
    enabled: boolean
    /** The pickup address, one entry per line. */
    address: string[]
    /** Null until the owner first saves them. */
    hours: OpeningHours | null
  }
  delivery: { enabled: boolean; feePaise: number; radiusKm: number | null }
  /** E.164, or null when the owner hasn't given one. */
  phone: string | null
}

export async function loadCartPage(): Promise<CartPageData> {
  // Capacity moves with every order: never prerender this.
  await connection()
  const settings = await getSettings()
  const now = new Date()
  const today = todayIn(settings.timezone, now)
  const lastDay = addDays(today, settings.orderAheadDays)

  const rows = await prisma.menuDay.findMany({
    where: { date: { gte: toDbDate(today), lte: toDbDate(lastDay) } },
    orderBy: { date: "asc" },
    select: {
      date: true,
      isOpen: true,
      cutoffAt: true,
      overbookLimit: true,
      _count: { select: { orders: { where: { status: { in: [...LIVE_STATUSES] } } } } },
    },
  })

  const days = dateRange(today, lastDay).flatMap((date): CartDay[] => {
    const row = rows.find((day) => fromDbDate(day.date) === date)
    if (!row) return []
    const taken = row._count.orders
    return [
      {
        date,
        status: dayStatus(row, taken, settings.orderingPaused, now),
        left: Math.max(0, row.overbookLimit - taken),
        capacity: row.overbookLimit,
        cutoff: dayCutoff(row.cutoffAt, settings.timezone),
      },
    ]
  })

  return {
    today,
    days,
    pickup: {
      enabled: settings.pickupEnabled,
      address: (settings.pickupAddress ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      hours: parseOpeningHours(settings.openingHours),
    },
    delivery: { enabled: settings.deliveryEnabled, feePaise: settings.deliveryFeePaise, radiusKm: settings.deliveryRadiusKm },
    phone: settings.publicPhone,
  }
}

/**
 * The cart's lines as `date`'s menu has them now: on it or not, how many are left, the price. Inactive and
 * archived items are not on it — placeOrder refuses them. A closed day lists nothing.
 */
export async function checkLines(date: IsoDate, ids: string[]): Promise<CartCheck> {
  const settings = await getSettings()
  const now = new Date()
  const [day, items] = await Promise.all([
    prisma.menuDay.findUnique({
      where: { date: toDbDate(date) },
      select: {
        isOpen: true,
        cutoffAt: true,
        overbookLimit: true,
        items: {
          where: { menuItemId: { in: ids } },
          select: { menuItemId: true, quantityAvailable: true, quantityOrdered: true, priceOverridePaise: true },
        },
        _count: { select: { orders: { where: { status: { in: [...LIVE_STATUSES] } } } } },
      },
    }),
    prisma.menuItem.findMany({
      where: { id: { in: ids } },
      select: { id: true, slug: true, name: true, images: true, basePricePaise: true, isActive: true, archivedAt: true },
    }),
  ])

  const byId = new Map(items.map((item) => [item.id, item]))
  return {
    date,
    status: dayStatus(day, day?._count.orders ?? 0, settings.orderingPaused, now),
    lines: ids.flatMap((id) => {
      const item = byId.get(id)
      if (!item) return []
      const line = day?.isOpen && item.isActive && !item.archivedAt ? day.items.find((row) => row.menuItemId === id) : undefined
      return [
        {
          menuItemId: id,
          slug: item.slug,
          name: item.name,
          image: item.images[0] ?? null,
          listed: Boolean(line),
          left: line ? Math.max(0, line.quantityAvailable - line.quantityOrdered) : 0,
          pricePaise: line?.priceOverridePaise ?? item.basePricePaise,
        },
      ]
    }),
  }
}
