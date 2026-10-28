import { connection } from "next/server"
import { cache } from "react"
import { todayIn } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { type Allergen, isAllergen } from "@/lib/menu/allergens"
import { asPriceUnit, type PriceUnit } from "@/lib/menu/units"
import { loadBookingWindow } from "@/lib/orders/booking"
import type { BookingWindow } from "@/lib/orders/deadline"
import { getSettings } from "@/lib/settings/row"
import { catalogueOrder, storeItemSelect, toStoreItem } from "./catalogue"
import { counterCloses, counterLines } from "./counter"
import type { StoreItem } from "./types"

/**
 * Read models for the item page (/menu/[slug], §10R), in two parts. `loadItemPage` is what changes only when the owner edits
 * the menu or the settings — the item and what else to try — so the page is prerendered with it (SSG, revalidated by those
 * actions) and crawlers get the whole item. `loadItemLive` is what moves with every order and the clock — the booking window
 * the date strip is judged against (orders/deadline.ts) and today's counter — fetched by the browser (GET /api/menu/[slug]).
 */

export type ItemPageData = {
  item: {
    id: string
    slug: string
    name: string
    shortDescription: string
    /** Plain text with the form's marks — **bold**, _italic_, "• " bullets (src/lib/menu/about.ts). */
    about: string | null
    /** In the owner's order, cover first; `alt` is "" when none was written. */
    photos: { id: string; alt: string }[]
    /** Online orders are priced at it (placeOrder). */
    basePricePaise: number
    priceUnit: PriceUnit
    /** Off → call only: no date strip, no Add — the bakery's phone. */
    orderable: boolean
    noticeDays: number
    ingredients: string[]
    allergens: Allergen[]
    sizeNote: string | null
    storageNote: string | null
  }
  /** The Settings default cutoff — what "orders close 6pm the day before" says for an item with no notice of its own. */
  defaultCutoff: { time: string; daysBefore: number }
  /** Up to four other items: orderable ones first, then the same category, then the bakery's order. */
  related: StoreItem[]
  /** E.164, or null when the owner hasn't given one. */
  phone: string | null
  /** The seller in the page's structured data. */
  bakeryName: string
}

export type ItemLive = {
  /** Today … today + orderAheadDays, every date with its limits and orders taken, as of the request. */
  window: BookingWindow
  /** On today's counter and not sold out — "On the counter today — walk in till 4pm or call". */
  counter: { closes: string | null } | null
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
  orderable: true,
  noticeDays: true,
  ingredients: true,
  allergens: true,
  sizeNote: true,
  storageNote: true,
} as const

/** Every active item's slug — the pages prerendered at build, and the sitemap. */
export function activeItems() {
  return prisma.menuItem.findMany({ where: { isActive: true, archivedAt: null }, select: { slug: true, updatedAt: true }, orderBy: { slug: "asc" } })
}

/**
 * The item page's static part, or null for a slug that isn't an active item — inactive and archived items can't be ordered,
 * so their page is a 404. `cache()`d: generateMetadata and the page share one read.
 */
export const loadItemPage = cache(async (slug: string): Promise<ItemPageData | null> => {
  const settings = await getSettings()
  const item = await prisma.menuItem.findFirst({ where: { slug, isActive: true, archivedAt: null }, select: itemSelect })
  if (!item) return null

  const [others, categories] = await Promise.all([
    prisma.menuItem.findMany({ where: { isActive: true, archivedAt: null, id: { not: item.id } }, select: storeItemSelect }),
    prisma.menuCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true } }),
  ])

  const related = catalogueOrder(others, categories)
    .map((other, index) => ({ other, index, rank: (other.orderable ? 0 : 2) + (other.category && other.category === item.category ? 0 : 1) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, RELATED)
    .map(({ other }) => toStoreItem(other))

  return {
    item: {
      id: item.id,
      slug: item.slug,
      name: item.name,
      shortDescription: item.shortDescription,
      about: item.about?.trim() || null,
      photos: item.images.map((id, index) => ({ id, alt: item.imageAlts[index] ?? "" })),
      basePricePaise: item.basePricePaise,
      priceUnit: asPriceUnit(item.priceUnit),
      orderable: item.orderable,
      noticeDays: item.noticeDays,
      ingredients: item.ingredients,
      allergens: item.allergens.filter(isAllergen),
      sizeNote: item.sizeNote?.trim() || null,
      storageNote: item.storageNote?.trim() || null,
    },
    defaultCutoff: { time: settings.defaultCutoffTime, daysBefore: settings.defaultCutoffDays },
    related,
    phone: settings.publicPhone,
    bakeryName: settings.bakeryName,
  }
})

/** The item page's live part, or null for a slug that isn't an active item. Never cached — the browser asks for it. */
export async function loadItemLive(slug: string): Promise<ItemLive | null> {
  await connection()
  const settings = await getSettings()
  const now = new Date()
  const today = todayIn(settings.timezone, now)

  const item = await prisma.menuItem.findFirst({ where: { slug, isActive: true, archivedAt: null }, select: { id: true } })
  if (!item) return null

  const [window, counter] = await Promise.all([loadBookingWindow(settings, now), counterLines(today)])
  const onCounter = counter.find((line) => line.menuItemId === item.id)
  return {
    window,
    counter: onCounter && !onCounter.soldOut ? { closes: counterCloses(settings.openingHours, today) } : null,
  }
}
