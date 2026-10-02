import { OrderStatus } from "@/generated/prisma/enums"
import { addDays, formatDayLabel, fromDbDate, type IsoDate, isoDateInZone, todayIn, toDbDate } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { isAllergen } from "@/lib/menu/allergens"
import { BLANK, type MenuItemValues, paiseToPrice } from "@/lib/menu/form"
import type { ScheduledDay } from "@/lib/menu/queries"
import { asPriceUnit } from "@/lib/menu/units"
import { getSettings } from "@/lib/settings"

/** Read model for the menu item form (/admin/menu/new and /admin/menu/[id]). */

export type UpcomingDay = ScheduledDay & { available: number }

export type ItemPerformance = {
  /** Open days in the last 30 (today included) that carried the item. */
  daysOnMenu: number
  /** Units on live orders for those days. */
  unitsOrdered: number
  /** Days where everything put out was ordered. */
  soldOutDays: number
}

export type MenuItemPage = {
  /** null on /admin/menu/new. */
  id: string | null
  values: MenuItemValues
  categories: { slug: string; name: string }[]
  /** Ingredients other items use, most used first — "Used before:". */
  ingredientSuggestions: string[]
  /** Label of the archive date, when the item is archived. */
  archivedLabel: string | null
  upcoming: UpcomingDay[]
  performance: ItemPerformance | null
}

const PERFORMANCE_DAYS = 30
const NOT_LIVE: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.NO_SHOW]

async function suggestions(excludeId: string | null): Promise<string[]> {
  const rows = await prisma.menuItem.findMany({ where: excludeId ? { id: { not: excludeId } } : {}, select: { ingredients: true } })
  const counts = new Map<string, { label: string; count: number }>()
  for (const ingredient of rows.flatMap((row) => row.ingredients)) {
    const key = ingredient.trim().toLowerCase()
    if (!key) continue
    const entry = counts.get(key) ?? { label: ingredient.trim(), count: 0 }
    entry.count += 1
    counts.set(key, entry)
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).map((entry) => entry.label)
}

async function performanceOf(id: string, today: IsoDate): Promise<ItemPerformance> {
  const from = toDbDate(addDays(today, -(PERFORMANCE_DAYS - 1)))
  const to = toDbDate(today)
  const [days, ordered] = await Promise.all([
    prisma.menuDayItem.findMany({
      where: { menuItemId: id, menuDay: { date: { gte: from, lte: to }, isOpen: true } },
      select: { quantityAvailable: true, quantityOrdered: true },
    }),
    prisma.orderItem.aggregate({
      where: { menuItemId: id, order: { fulfilmentDate: { gte: from, lte: to }, status: { notIn: NOT_LIVE } } },
      _sum: { quantity: true },
    }),
  ])
  return {
    daysOnMenu: days.length,
    unitsOrdered: ordered._sum.quantity ?? 0,
    soldOutDays: days.filter((day) => day.quantityAvailable > 0 && day.quantityOrdered >= day.quantityAvailable).length,
  }
}

export async function loadMenuItemPage(id: string | null): Promise<MenuItemPage | null> {
  const settings = await getSettings()
  const today = todayIn(settings.timezone)
  const [categories, ingredientSuggestions] = await Promise.all([
    prisma.menuCategory.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true, name: true } }),
    suggestions(id),
  ])

  if (!id) return { id: null, values: BLANK, categories, ingredientSuggestions, archivedLabel: null, upcoming: [], performance: null }

  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: {
      dayItems: {
        where: { menuDay: { date: { gte: toDbDate(today) } } },
        select: { quantityAvailable: true, quantityOrdered: true, menuDay: { select: { date: true } } },
        orderBy: { menuDay: { date: "asc" } },
      },
    },
  })
  if (!item) return null

  // A category that was switched off still shows as this item's choice.
  if (item.category && !categories.some((category) => category.slug === item.category)) {
    const own = await prisma.menuCategory.findUnique({ where: { slug: item.category }, select: { slug: true, name: true } })
    if (own) categories.push(own)
  }

  const values: MenuItemValues = {
    name: item.name,
    slug: item.slug,
    shortDescription: item.shortDescription,
    category: item.category ? { slug: item.category } : null,
    price: paiseToPrice(item.basePricePaise),
    priceUnit: asPriceUnit(item.priceUnit),
    isActive: item.isActive,
    photos: item.images.map((publicId, index) => ({ publicId, alt: item.imageAlts[index] ?? "" })),
    about: item.about ?? "",
    ingredients: item.ingredients,
    allergens: item.allergens.filter(isAllergen),
    defaultQuantity: item.defaultQuantity,
    sizeNote: item.sizeNote ?? "",
    storageNote: item.storageNote ?? "",
  }

  return {
    id: item.id,
    values,
    categories,
    ingredientSuggestions,
    archivedLabel: item.archivedAt ? formatDayLabel(isoDateInZone(item.archivedAt, settings.timezone)) : null,
    upcoming: item.dayItems.map((dayItem) => {
      const date = fromDbDate(dayItem.menuDay.date)
      return { date, dayLabel: formatDayLabel(date), isToday: date === today, ordered: dayItem.quantityOrdered, available: dayItem.quantityAvailable }
    }),
    performance: await performanceOf(item.id, today),
  }
}
