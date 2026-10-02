import type { DayPlan } from "@/lib/calendar/form"
import { dayHref, inPlanningRange, weekHref } from "@/lib/calendar/routes"
import type { DayOrder } from "@/lib/calendar/week"
import { addDays, formatDayLabel, formatLongDayLabel, fromDbDate, type IsoDate, todayIn, toDbDate, weekStart } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { paiseToPrice } from "@/lib/menu/form"
import { asPriceUnit, type PriceUnit } from "@/lib/menu/units"
import { LIVE_STATUSES, VERIFIED_STATUSES } from "@/lib/orders/status"
import { getSettings } from "@/lib/settings"

/** Read model for the day editor (/admin/calendar/[date]). */

export type EditorItem = {
  id: string
  name: string
  categorySlug: string | null
  basePricePaise: number
  priceUnit: PriceUnit
  /** Cover public_id. */
  image: string | null
  defaultQuantity: number
  /** Inactive or archived items only appear while they're on this day — they can be taken off, not added. */
  state: "active" | "inactive" | "archived"
}

/** A recent day whose setup "Copy from another day" can pull in. */
export type CopySource = {
  date: IsoDate
  /** "Sat 26 Sep" */
  label: string
  tag: "today" | "lastWeek" | null
  items: { menuItemId: string; quantity: number }[]
  names: string[]
}

export type DayEditorData = {
  date: IsoDate
  /** "Saturday 3 Oct" */
  title: string
  today: IsoDate
  /** Before today — shown read-only. */
  isPast: boolean
  prevHref: string | null
  nextHref: string | null
  weekHref: string
  planned: boolean
  saved: DayPlan
  /** Units already ordered per item — a quantity can't go below it. */
  ordered: Record<string, number>
  /** Listed in category order, then by name. */
  items: EditorItem[]
  /** Categories that have an item in the list, in the bakery's order. */
  categories: { slug: string; name: string }[]
  verified: number
  liveOrders: DayOrder[]
  copySources: CopySource[]
  bakeryName: string
  timezone: string
  /** When the page was read (ISO) — "Ordering closed at…" is judged against it, the same on server and client. */
  now: string
}

/** How far back "Copy from another day" offers days, and how many. */
const SOURCE_WINDOW = 14
const SOURCE_COUNT = 6

export async function loadDayEditor(date: IsoDate): Promise<DayEditorData | null> {
  const settings = await getSettings()
  const today = todayIn(settings.timezone)
  if (!inPlanningRange(date, today)) return null

  const windowStart = addDays(date, -SOURCE_WINDOW)
  const [categories, day, catalogue, sourceDays] = await Promise.all([
    prisma.menuCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true, name: true } }),
    prisma.menuDay.findUnique({
      where: { date: toDbDate(date) },
      include: {
        items: true,
        orders: { where: { status: { in: [...LIVE_STATUSES] } }, select: { id: true, code: true, customerName: true, status: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.menuItem.findMany({
      select: { id: true, name: true, category: true, basePricePaise: true, priceUnit: true, images: true, defaultQuantity: true, isActive: true, archivedAt: true },
    }),
    prisma.menuDay.findMany({
      where: { date: { gte: toDbDate(windowStart), lt: toDbDate(addDays(date, 8)), not: toDbDate(date) }, items: { some: {} } },
      select: { date: true, items: { select: { menuItemId: true, quantityAvailable: true } } },
    }),
  ])

  const onDay = new Map((day?.items ?? []).map((row) => [row.menuItemId, row]))
  const categoryOrder = new Map(categories.map((category, index) => [category.slug, index]))
  const listed = catalogue
    .filter((item) => onDay.has(item.id) || (item.isActive && !item.archivedAt))
    .sort((a, b) => (categoryOrder.get(a.category ?? "") ?? 99) - (categoryOrder.get(b.category ?? "") ?? 99) || a.name.localeCompare(b.name))
  const items: EditorItem[] = listed.map((item) => ({
    id: item.id,
    name: item.name,
    categorySlug: item.category,
    basePricePaise: item.basePricePaise,
    priceUnit: asPriceUnit(item.priceUnit),
    image: item.images[0] ?? null,
    defaultQuantity: item.defaultQuantity,
    state: item.archivedAt ? "archived" : item.isActive ? "active" : "inactive",
  }))

  const saved: DayPlan = {
    isOpen: day?.isOpen ?? true,
    cutoff: day ? { time: day.cutoffTime, daysBefore: day.cutoffDaysBefore } : { time: settings.defaultCutoffTime, daysBefore: settings.defaultCutoffDays },
    maxOrders: day?.maxOrders ?? settings.defaultMaxOrders,
    overbookLimit: day?.overbookLimit ?? settings.defaultOverbook,
    publicNote: day?.publicNote ?? "",
    closureNote: day?.closureNote ?? "",
    items: Object.fromEntries(
      items.map((item) => {
        const row = onDay.get(item.id)
        return [
          item.id,
          {
            included: Boolean(row),
            quantity: row?.quantityAvailable ?? item.defaultQuantity,
            override: row?.priceOverridePaise != null ? paiseToPrice(row.priceOverridePaise) : "",
          },
        ]
      }),
    ),
  }

  // Only items the copy could actually tick: listed, and active.
  const copyable = new Set(items.filter((item) => item.state === "active").map((item) => item.id))
  const names = new Map(items.map((item) => [item.id, item.name]))
  const sources = sourceDays
    .map((source) => ({ date: fromDbDate(source.date), rows: source.items.filter((row) => copyable.has(row.menuItemId)) }))
    .filter((source) => source.rows.length > 0)
  // The planned days nearest this one, and always the same weekday last week when it was planned.
  const lastWeek = addDays(date, -7)
  const distance = (other: IsoDate) => Math.abs(toDbDate(other).getTime() - toDbDate(date).getTime())
  const nearest = [...sources].sort((a, b) => distance(a.date) - distance(b.date) || b.date.localeCompare(a.date))
  const picked = nearest.slice(0, SOURCE_COUNT)
  const lastWeekSource = nearest.find((source) => source.date === lastWeek)
  if (lastWeekSource && !picked.includes(lastWeekSource)) picked[picked.length - 1] = lastWeekSource
  const copySources: CopySource[] = picked
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((source) => {
      const rows = [...source.rows].sort((a, b) => listed.findIndex((item) => item.id === a.menuItemId) - listed.findIndex((item) => item.id === b.menuItemId))
      return {
        date: source.date,
        label: formatDayLabel(source.date),
        tag: source.date === today ? "today" : source.date === lastWeek ? "lastWeek" : null,
        items: rows.map((row) => ({ menuItemId: row.menuItemId, quantity: row.quantityAvailable })),
        names: rows.map((row) => names.get(row.menuItemId) ?? ""),
      }
    })

  const usedSlugs = new Set(items.map((item) => item.categorySlug))
  const prev = addDays(date, -1)
  const next = addDays(date, 1)
  const orders = day?.orders ?? []

  return {
    date,
    title: formatLongDayLabel(date),
    today,
    isPast: date < today,
    prevHref: inPlanningRange(prev, today) ? dayHref(prev) : null,
    nextHref: inPlanningRange(next, today) ? dayHref(next) : null,
    weekHref: weekHref(weekStart(date), today),
    planned: Boolean(day),
    saved,
    ordered: Object.fromEntries([...onDay.values()].map((row) => [row.menuItemId, row.quantityOrdered])),
    items,
    categories: categories.filter((category) => usedSlugs.has(category.slug)),
    verified: orders.filter((order) => VERIFIED_STATUSES.includes(order.status)).length,
    liveOrders: orders.map((order) => ({ id: order.id, code: order.code, name: order.customerName })),
    copySources,
    bakeryName: settings.bakeryName,
    timezone: settings.timezone,
    now: new Date().toISOString(),
  }
}
