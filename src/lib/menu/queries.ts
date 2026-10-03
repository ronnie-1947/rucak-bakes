import { OrderStatus } from "@/generated/prisma/enums"
import { addDays, formatDayLabel, fromDbDate, type IsoDate, isoDateInZone, todayIn, toDbDate } from "@/lib/dates"
import { prisma } from "@/lib/db"
import type { MenuFilters, SortChoice } from "@/lib/menu/filters"
import { asPriceUnit, type PriceUnit } from "@/lib/menu/units"
import { getSettings } from "@/lib/settings/row"

/**
 * Read models for the menu library (/admin/menu). A bakery's menu is a few dozen items, so the whole
 * library is read once and searched, filtered and sorted here — the counts line needs the totals anyway.
 */

/** One upcoming day an item is scheduled on — what the deactivate and archive dialogs name. */
export type ScheduledDay = {
  date: IsoDate
  dayLabel: string
  isToday: boolean
  /** Units already ordered on that day. A day with orders keeps the item when it's removed elsewhere. */
  ordered: number
}

export type MenuItemRow = {
  id: string
  name: string
  categoryName: string | null
  pricePaise: number
  priceUnit: PriceUnit
  /** Cloudinary public_ids, cover first. */
  images: string[]
  isActive: boolean
  /** Open days in the next seven (today included) that carry it. */
  daysThisWeek: number
  /** Units on this calendar month's live orders (cancelled and no-show left out). */
  orderedThisMonth: number
  upcoming: ScheduledDay[]
}

export type ArchivedItemRow = {
  id: string
  name: string
  categoryName: string | null
  images: string[]
  archivedLabel: string
  /** Order lines that still name it — why it can only be archived, never deleted. */
  pastOrders: number
}

export type MenuLibrary = {
  categories: { slug: string; name: string }[]
  /** After search, category and status, in the chosen order. */
  items: MenuItemRow[]
  totalCount: number
  activeCount: number
  archivedCount: number
  /** Only read for the archived view. */
  archived: ArchivedItemRow[]
}

const NOT_LIVE: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.NO_SHOW]

function monthBounds(today: IsoDate): { start: IsoDate; end: IsoDate } {
  const [year, month] = today.split("-").map(Number)
  const next = new Date(Date.UTC(year, month, 1))
  return { start: `${today.slice(0, 7)}-01`, end: next.toISOString().slice(0, 10) }
}

/** A row plus what only the search and sort need. */
type Entry = { row: MenuItemRow; slug: string | null; ingredients: string[]; updatedAt: Date }

const sorters: Record<SortChoice, (a: Entry, b: Entry) => number> = {
  name: (a, b) => a.row.name.localeCompare(b.row.name),
  recent: (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  ordered: (a, b) => b.row.orderedThisMonth - a.row.orderedThisMonth || a.row.name.localeCompare(b.row.name),
  price: (a, b) => b.row.pricePaise - a.row.pricePaise || a.row.name.localeCompare(b.row.name),
}

export async function loadMenuLibrary(filters: MenuFilters): Promise<MenuLibrary> {
  const settings = await getSettings()
  const today = todayIn(settings.timezone)
  const weekEnd = addDays(today, 6)
  const month = monthBounds(today)

  const [categories, items, ordered, archivedCount, archived] = await Promise.all([
    prisma.menuCategory.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true, name: true } }),
    prisma.menuItem.findMany({
      where: { archivedAt: null },
      select: {
        id: true,
        name: true,
        category: true,
        basePricePaise: true,
        priceUnit: true,
        ingredients: true,
        images: true,
        isActive: true,
        updatedAt: true,
        dayItems: {
          where: { menuDay: { date: { gte: toDbDate(today) } } },
          select: { quantityOrdered: true, menuDay: { select: { date: true, isOpen: true } } },
          orderBy: { menuDay: { date: "asc" } },
        },
      },
    }),
    prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: { order: { fulfilmentDate: { gte: toDbDate(month.start), lt: toDbDate(month.end) }, status: { notIn: NOT_LIVE } } },
      _sum: { quantity: true },
    }),
    prisma.menuItem.count({ where: { archivedAt: { not: null } } }),
    filters.archived
      ? prisma.menuItem.findMany({
          where: { archivedAt: { not: null } },
          orderBy: { archivedAt: "desc" },
          select: { id: true, name: true, category: true, images: true, archivedAt: true, _count: { select: { orderItems: true } } },
        })
      : Promise.resolve([]),
  ])

  const categoryName = new Map(categories.map((category) => [category.slug, category.name]))
  const orderedBy = new Map(ordered.map((row) => [row.menuItemId, row._sum.quantity ?? 0]))

  const entries = items.map((item): Entry => {
    const upcoming = item.dayItems.map((dayItem) => ({
      date: fromDbDate(dayItem.menuDay.date),
      quantityOrdered: dayItem.quantityOrdered,
      isOpen: dayItem.menuDay.isOpen,
    }))
    return {
      row: {
        id: item.id,
        name: item.name,
        categoryName: item.category ? (categoryName.get(item.category) ?? null) : null,
        pricePaise: item.basePricePaise,
        priceUnit: asPriceUnit(item.priceUnit),
        images: item.images,
        isActive: item.isActive,
        daysThisWeek: upcoming.filter((day) => day.isOpen && day.date <= weekEnd).length,
        orderedThisMonth: orderedBy.get(item.id) ?? 0,
        upcoming: upcoming.map((day) => ({
          date: day.date,
          dayLabel: formatDayLabel(day.date),
          isToday: day.date === today,
          ordered: day.quantityOrdered,
        })),
      },
      slug: item.category,
      ingredients: item.ingredients,
      updatedAt: item.updatedAt,
    }
  })

  const q = filters.q.toLowerCase()
  const matches = entries
    .filter((entry) => filters.cat === null || entry.slug === filters.cat)
    .filter((entry) => filters.status === "all" || entry.row.isActive === (filters.status === "active"))
    .filter((entry) => !q || entry.row.name.toLowerCase().includes(q) || entry.ingredients.some((ingredient) => ingredient.toLowerCase().includes(q)))
    .sort(sorters[filters.sort])

  return {
    categories,
    items: matches.map((entry) => entry.row),
    totalCount: entries.length,
    activeCount: entries.filter((entry) => entry.row.isActive).length,
    archivedCount,
    archived: archived.map((item) => ({
      id: item.id,
      name: item.name,
      categoryName: item.category ? (categoryName.get(item.category) ?? null) : null,
      images: item.images,
      archivedLabel: item.archivedAt ? formatDayLabel(isoDateInZone(item.archivedAt, settings.timezone)) : "",
      pastOrders: item._count.orderItems,
    })),
  }
}
