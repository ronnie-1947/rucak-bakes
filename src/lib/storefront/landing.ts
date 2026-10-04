import { connection } from "next/server"
import { addDays, fromDbDate, type IsoDate, todayIn, toDbDate } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { LIVE_STATUSES } from "@/lib/orders/status"
import { type OpeningHours, parseOpeningHours } from "@/lib/settings/hours"
import { getSettings } from "@/lib/settings/row"
import { catalogueOrder, storeItemSelect, toStoreItem } from "./catalogue"
import { dayCutoff, dayStatus } from "./status"
import type { CatalogueItem, DayItem, StoreDay } from "./types"

/** Read model for the landing page (/): today's and tomorrow's menus, everything we bake, how to find us. */

export type LandingData = {
  today: IsoDate
  /** Today, then tomorrow. */
  days: [StoreDay, StoreDay]
  /** Every active item, in the bakery's category order, then by name. */
  catalogue: CatalogueItem[]
  hero: { image: string | null; tagline: string | null }
  visit: {
    /** The pickup address, one entry per line. */
    address: string[]
    /** E.164, or null when the owner hasn't given one. */
    phone: string | null
    /** Null until the owner first saves them. */
    hours: OpeningHours | null
  }
}

export async function loadLanding(): Promise<LandingData> {
  // Capacity moves with every order: never prerender this.
  await connection()
  const settings = await getSettings()
  const now = new Date()
  const today = todayIn(settings.timezone, now)
  const tomorrow = addDays(today, 1)
  const lastDay = addDays(today, settings.orderAheadDays)

  const [items, categories, rows] = await Promise.all([
    prisma.menuItem.findMany({ where: { isActive: true, archivedAt: null }, select: storeItemSelect }),
    prisma.menuCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true } }),
    prisma.menuDay.findMany({
      // orderAheadDays is at least 1, so the window always reaches tomorrow.
      where: { date: { gte: toDbDate(today), lte: toDbDate(lastDay) } },
      orderBy: { date: "asc" },
      include: {
        items: { select: { menuItemId: true, quantityAvailable: true, quantityOrdered: true, priceOverridePaise: true } },
        _count: { select: { orders: { where: { status: { in: [...LIVE_STATUSES] } } } } },
      },
    }),
  ])

  // The order every list on the page uses.
  const ordered = catalogueOrder(items, categories)
  const position = new Map(ordered.map((item, index) => [item.id, index]))
  const byId = new Map(ordered.map((item) => [item.id, item]))

  const storeDay = (date: IsoDate): StoreDay => {
    const row = rows.find((day) => fromDbDate(day.date) === date)
    if (!row) return { date, status: dayStatus(null, 0, settings.orderingPaused, now), left: 0, capacity: 0, taken: 0, cutoff: null, note: null, items: [] }

    const taken = row._count.orders
    const status = dayStatus(row, taken, settings.orderingPaused, now)
    // Inactive and archived items stay on a planned day but can't be ordered (placeOrder refuses them): left off.
    const dayItems: DayItem[] = row.isOpen
      ? row.items
          .flatMap((line) => {
            const item = byId.get(line.menuItemId)
            if (!item) return []
            const left = Math.max(0, line.quantityAvailable - line.quantityOrdered)
            return [{ ...toStoreItem(item, line.priceOverridePaise ?? item.basePricePaise), left }]
          })
          .sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0))
      : []

    return {
      date,
      status,
      left: Math.max(0, row.overbookLimit - taken),
      capacity: row.overbookLimit,
      taken,
      cutoff: dayCutoff(row.cutoffAt, settings.timezone),
      note: (row.isOpen ? row.publicNote : row.closureNote)?.trim() || null,
      items: dayItems,
    }
  }

  // "Back Thursday": the first later day still taking orders that has the item.
  const later = rows.filter((day) => fromDbDate(day.date) > tomorrow && day.isOpen && day.cutoffAt.getTime() > now.getTime())
  const nextDate = (id: string): IsoDate | null => {
    const day = later.find((row) => row.items.some((line) => line.menuItemId === id))
    return day ? fromDbDate(day.date) : null
  }

  return {
    today,
    days: [storeDay(today), storeDay(tomorrow)],
    catalogue: ordered.map((item) => ({ ...toStoreItem(item), next: nextDate(item.id) })),
    hero: { image: settings.heroImage, tagline: settings.tagline?.trim() || null },
    visit: {
      address: (settings.pickupAddress ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      phone: settings.publicPhone,
      hours: parseOpeningHours(settings.openingHours),
    },
  }
}
