import { OrderStatus } from "@/generated/prisma/enums"
import { addDays, formatDayLabel, fromDbDate, type IsoDate, isoDateInZone, todayIn, toDbDate } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { isAllergen } from "@/lib/menu/allergens"
import { BLANK, type MenuItemValues, NOTICE, paiseToPrice } from "@/lib/menu/form"
import { asPriceUnit } from "@/lib/menu/units"
import { getSettings } from "@/lib/settings/row"

/** Read model for the menu item form (/admin/menu/new and /admin/menu/[id]). */

/** A date from today on with orders for the item, or with it on the counter. */
export type UpcomingDay = {
  date: IsoDate
  dayLabel: string
  isToday: boolean
  /** The counter-item's quantity made — null when it isn't on that day's counter. */
  made: number | null
  /** Units on live orders for that date. */
  ordered: number
}

export type ItemPerformance = {
  /** Live orders with it in the last 30 days (today included). */
  orders: number
  /** Units on those orders. */
  unitsOrdered: number
  /** Open days in the last 30 it was a counter-item. */
  counterDays: number
  /** Of those, days the counter ran out (`soldOutAt`). */
  soldOutDays: number
}

/** What the Ordering section's "Order by Friday 6pm for a Saturday pickup" is worked out from — the Settings defaults. */
export type NoticeRules = { today: IsoDate; cutoffTime: string; cutoffDaysBefore: number }

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
  rules: NoticeRules
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
  const [counter, ordered] = await Promise.all([
    prisma.menuDayItem.findMany({
      where: { menuItemId: id, menuDay: { date: { gte: from, lte: to }, isOpen: true } },
      select: { soldOutAt: true },
    }),
    prisma.orderItem.aggregate({
      where: { menuItemId: id, order: { fulfilmentDate: { gte: from, lte: to }, status: { notIn: NOT_LIVE } } },
      _sum: { quantity: true },
      _count: { orderId: true },
    }),
  ])
  return {
    orders: ordered._count.orderId,
    unitsOrdered: ordered._sum.quantity ?? 0,
    counterDays: counter.length,
    soldOutDays: counter.filter((day) => day.soldOutAt !== null).length,
  }
}

/** Dates from today on: the counter-item rows and the live order lines, merged by date. */
async function upcomingOf(id: string, today: IsoDate): Promise<UpcomingDay[]> {
  const [counter, lines] = await Promise.all([
    prisma.menuDayItem.findMany({
      where: { menuItemId: id, menuDay: { date: { gte: toDbDate(today) } } },
      select: { quantityAvailable: true, menuDay: { select: { date: true } } },
    }),
    prisma.orderItem.findMany({
      where: { menuItemId: id, order: { fulfilmentDate: { gte: toDbDate(today) }, status: { notIn: NOT_LIVE } } },
      select: { quantity: true, order: { select: { fulfilmentDate: true } } },
    }),
  ])
  const days = new Map<IsoDate, { made: number | null; ordered: number }>()
  const at = (date: IsoDate) => {
    const day = days.get(date) ?? { made: null, ordered: 0 }
    days.set(date, day)
    return day
  }
  for (const row of counter) at(fromDbDate(row.menuDay.date)).made = row.quantityAvailable
  for (const line of lines) at(fromDbDate(line.order.fulfilmentDate)).ordered += line.quantity
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, day]) => ({ date, dayLabel: formatDayLabel(date), isToday: date === today, ...day }))
}

export async function loadMenuItemPage(id: string | null): Promise<MenuItemPage | null> {
  const settings = await getSettings()
  const today = todayIn(settings.timezone)
  const rules: NoticeRules = { today, cutoffTime: settings.defaultCutoffTime, cutoffDaysBefore: settings.defaultCutoffDays }
  const [categories, ingredientSuggestions] = await Promise.all([
    prisma.menuCategory.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true, name: true } }),
    suggestions(id),
  ])

  if (!id) return { id: null, values: BLANK, categories, ingredientSuggestions, archivedLabel: null, upcoming: [], performance: null, rules }

  const item = await prisma.menuItem.findUnique({ where: { id } })
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
    price: item.basePricePaise > 0 ? paiseToPrice(item.basePricePaise) : "",
    priceUnit: asPriceUnit(item.priceUnit),
    isActive: item.isActive,
    photos: item.images.map((publicId, index) => ({ publicId, alt: item.imageAlts[index] ?? "" })),
    about: item.about ?? "",
    ingredients: item.ingredients,
    allergens: item.allergens.filter(isAllergen),
    orderable: item.orderable,
    // The database allows 30; more than the booking window could never be ordered, so the form shows its own maximum.
    noticeDays: Math.min(item.noticeDays, NOTICE.max),
    bakeSeparately: item.bakeSeparately,
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
    upcoming: await upcomingOf(item.id, today),
    performance: await performanceOf(item.id, today),
    rules,
  }
}
