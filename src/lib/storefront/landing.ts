import { type IsoDate, todayIn } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { loadBookingWindow } from "@/lib/orders/booking"
import { dayAvailability } from "@/lib/orders/deadline"
import { type OpeningHours, parseOpeningHours } from "@/lib/settings/hours"
import { getSettings } from "@/lib/settings/row"
import { catalogueOrder, storeItemSelect, toStoreItem } from "./catalogue"
import { counterCloses, counterLines } from "./counter"
import type { CatalogueItem, CounterItem, FreshToday } from "./types"

/** Read model for the landing page (/): today's counter, everything we bake, how to find us (§10R). */

export type LandingData = {
  today: IsoDate
  /** Null when nothing's on the counter today — orders only, or closed — and the band isn't shown. */
  fresh: FreshToday | null
  /** Every active item, in the bakery's category order, then by name. */
  catalogue: CatalogueItem[]
  /** The categories that have an item, in the bakery's order — the filter chips. */
  categories: { slug: string; name: string }[]
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
  // Prerendered: every write the page shows (menu, calendar, settings, orders) revalidates "/". There's no time-based
  // revalidation, so `today` and the deadlines are as of the last such write.
  const settings = await getSettings()
  const now = new Date()
  const today = todayIn(settings.timezone, now)

  const [items, categories, counter, window] = await Promise.all([
    prisma.menuItem.findMany({ where: { isActive: true, archivedAt: null }, select: storeItemSelect }),
    prisma.menuCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true, name: true } }),
    counterLines(today),
    loadBookingWindow(settings, now),
  ])

  // The order every list on the page uses.
  const ordered = catalogueOrder(items, categories)
  const onCounter = new Map(counter.map((line) => [line.menuItemId, line]))
  const open = window.days[0]?.isOpen ?? false

  // Inactive and archived items stay on a planned day but aren't shown: `ordered` only holds active ones.
  const freshItems: CounterItem[] = open
    ? ordered.flatMap((item) => {
        const line = onCounter.get(item.id)
        return line ? [{ ...toStoreItem(item, line.priceOverridePaise ?? item.basePricePaise), soldOut: line.soldOut }] : []
      })
    : []
  const used = new Set(ordered.map((item) => item.category))
  // Judged by the deadline rule, as the item page's strip is; none while ordering is paused. The cart and placeOrder check again.
  const datesFor = (item: { orderable: boolean; noticeDays: number }): IsoDate[] =>
    item.orderable && !window.paused
      ? window.days.filter((day) => dayAvailability(day, [item.noticeDays], window) === "open").map((day) => day.date)
      : []

  return {
    today,
    fresh:
      freshItems.length > 0
        ? {
            state: freshItems.every((item) => item.soldOut) ? "soldOut" : "on",
            items: freshItems,
            closes: counterCloses(settings.openingHours, today),
          }
        : null,
    catalogue: ordered.map((item) => ({
      ...toStoreItem(item),
      category: item.category,
      onCounter: open && onCounter.has(item.id),
      dates: datesFor(item),
    })),
    categories: categories.filter((category) => used.has(category.slug)),
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
