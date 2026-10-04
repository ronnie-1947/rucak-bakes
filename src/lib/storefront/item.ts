import { connection } from "next/server"
import { cache } from "react"
import { addDays, dateRange, fromDbDate, type IsoDate, todayIn, toDbDate } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { type Allergen, isAllergen } from "@/lib/menu/allergens"
import { asPriceUnit, type PriceUnit } from "@/lib/menu/units"
import { LIVE_STATUSES } from "@/lib/orders/status"
import { getSettings } from "@/lib/settings/row"
import { catalogueOrder, storeItemSelect, toStoreItem } from "./catalogue"
import { dayCutoff, dayStatus } from "./status"
import type { ItemDay, StoreItem } from "./types"

/** Read model for the item page (/menu/[slug]): the item, which days of the order-ahead window have it, and what else to try. */

export type ItemPageData = {
  today: IsoDate
  item: {
    id: string
    slug: string
    name: string
    shortDescription: string
    /** Plain text with the form's marks — **bold**, _italic_, "• " bullets (src/lib/menu/about.ts). */
    about: string | null
    /** In the owner's order, cover first; `alt` is "" when none was written. */
    photos: { id: string; alt: string }[]
    basePricePaise: number
    priceUnit: PriceUnit
    ingredients: string[]
    allergens: Allergen[]
    sizeNote: string | null
    storageNote: string | null
  }
  /** Today through the last day of the order-ahead window that has the item — always at least through tomorrow. */
  days: ItemDay[]
  /** Up to four other items: on the menu soon first, then the same category, then the bakery's order. */
  related: StoreItem[]
  /** E.164, or null when the owner hasn't given one — offered when the item is sold out. */
  phone: string | null
}

const RELATED = 4

const itemSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  about: true,
  category: true,
  images: true,
  imageAlts: true,
  basePricePaise: true,
  priceUnit: true,
  ingredients: true,
  allergens: true,
  sizeNote: true,
  storageNote: true,
} as const

/** Null for a slug that isn't an active item — inactive and archived items can't be ordered, so their page is a 404. Once per request. */
export const loadItem = cache(async (slug: string): Promise<ItemPageData | null> => {
  // Quantities left move with every order: never prerender this.
  await connection()
  const settings = await getSettings()
  const now = new Date()
  const today = todayIn(settings.timezone, now)
  const lastDay = addDays(today, settings.orderAheadDays)
  const inWindow = { gte: toDbDate(today), lte: toDbDate(lastDay) }

  const item = await prisma.menuItem.findFirst({ where: { slug, isActive: true, archivedAt: null }, select: itemSelect })
  if (!item) return null

  const [rows, others, categories, soon] = await Promise.all([
    prisma.menuDay.findMany({
      where: { date: inWindow },
      orderBy: { date: "asc" },
      select: {
        date: true,
        isOpen: true,
        cutoffAt: true,
        overbookLimit: true,
        items: { where: { menuItemId: item.id }, select: { quantityAvailable: true, quantityOrdered: true, priceOverridePaise: true } },
        _count: { select: { orders: { where: { status: { in: [...LIVE_STATUSES] } } } } },
      },
    }),
    prisma.menuItem.findMany({ where: { isActive: true, archivedAt: null, id: { not: item.id } }, select: storeItemSelect }),
    prisma.menuCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true } }),
    // Items a customer could still order this week — "you might also like" leads with these.
    prisma.menuDayItem.findMany({
      where: { menuDay: { date: inWindow, isOpen: true, cutoffAt: { gt: now } } },
      distinct: ["menuItemId"],
      select: { menuItemId: true },
    }),
  ])

  const itemDay = (date: IsoDate): ItemDay => {
    const row = rows.find((day) => fromDbDate(day.date) === date) ?? null
    // A closed day keeps its rows but sells nothing (the landing leaves its items off too).
    const line = row?.isOpen ? row.items[0] : undefined
    return {
      date,
      status: dayStatus(row, row?._count.orders ?? 0, settings.orderingPaused, now),
      listed: Boolean(line),
      pricePaise: line?.priceOverridePaise ?? item.basePricePaise,
      left: line ? Math.max(0, line.quantityAvailable - line.quantityOrdered) : 0,
      quantity: line?.quantityAvailable ?? 0,
      cutoff: row ? dayCutoff(row.cutoffAt, settings.timezone) : null,
    }
  }
  const ahead = dateRange(today, lastDay).map(itemDay)
  // Trailing days without the item say nothing a customer needs; today and tomorrow always show.
  const lastListed = ahead.findLastIndex((day) => day.listed)
  const days = ahead.slice(0, Math.max(2, lastListed + 1))

  const onSoon = new Set(soon.map((line) => line.menuItemId))
  const related = catalogueOrder(others, categories)
    .map((other, index) => ({ other, index, rank: (onSoon.has(other.id) ? 0 : 2) + (other.category && other.category === item.category ? 0 : 1) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, RELATED)
    .map(({ other }) => toStoreItem(other))

  return {
    today,
    item: {
      id: item.id,
      slug: item.slug,
      name: item.name,
      shortDescription: item.shortDescription,
      about: item.about?.trim() || null,
      photos: item.images.map((id, index) => ({ id, alt: item.imageAlts[index] ?? "" })),
      basePricePaise: item.basePricePaise,
      priceUnit: asPriceUnit(item.priceUnit),
      ingredients: item.ingredients,
      allergens: item.allergens.filter(isAllergen),
      sizeNote: item.sizeNote?.trim() || null,
      storageNote: item.storageNote?.trim() || null,
    },
    days,
    related,
    phone: settings.publicPhone,
  }
})
