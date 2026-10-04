import { asPriceUnit } from "@/lib/menu/units"
import type { StoreItem } from "./types"

/** What every customer list shares about menu items: the columns a card needs and the order items appear in. */

/** The MenuItem columns behind a customer card. */
export const storeItemSelect = {
  id: true,
  slug: true,
  name: true,
  category: true,
  images: true,
  imageAlts: true,
  basePricePaise: true,
  priceUnit: true,
} as const

type StoreItemRow = {
  id: string
  slug: string
  name: string
  images: string[]
  imageAlts: string[]
  basePricePaise: number
  priceUnit: string
}

/** A row as a card: the cover and its alt text, priced for a day (override, else base). */
export function toStoreItem(item: StoreItemRow, pricePaise: number = item.basePricePaise): StoreItem {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    image: item.images[0] ?? null,
    imageAlt: item.imageAlts[0] ?? "",
    pricePaise,
    priceUnit: asPriceUnit(item.priceUnit),
  }
}

/** The bakery's category order (`categories` already sorted), uncategorised last, then by name. */
export function catalogueOrder<T extends { category: string | null; name: string }>(items: T[], categories: { slug: string }[]): T[] {
  const rank = new Map(categories.map((category, index) => [category.slug, index]))
  const of = (item: T) => rank.get(item.category ?? "") ?? categories.length
  return [...items].sort((a, b) => of(a) - of(b) || a.name.localeCompare(b.name))
}
