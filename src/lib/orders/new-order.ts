import { type CustomerLookup, lookupCustomer } from "@/lib/customers/lookup"
import { type IsoDate, isIsoDate, weekday } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { asPriceUnit, type PriceUnit } from "@/lib/menu/units"
import { loadBookingWindow } from "@/lib/orders/booking"
import type { BookingWindow } from "@/lib/orders/deadline"
import { staffRoom } from "@/lib/orders/staff-order"
import { DEFAULT_HOURS, parseOpeningHours, pickupSlots, weekdayKey } from "@/lib/settings/hours"
import { getSettings } from "@/lib/settings/row"
import { catalogueOrder } from "@/lib/storefront/catalogue"

/**
 * Read model for /admin/orders/new (dev-docs/implementation.md 7R.5): everything staff can put on an order — every item
 * still on the menu, call-only ones included — the booking window's days with their orders, each day's pickup times, the
 * delivery fee, and what the link asked to start from (`?date=`, `?customer=`).
 */

export type NewOrderItem = {
  id: string
  name: string
  images: string[]
  /** The menu price — a line starts at it. */
  pricePaise: number
  unit: PriceUnit
  /** Off = call only: never in a customer's cart, exactly what a phone order is for. */
  orderable: boolean
  noticeDays: number
  category: string | null
}

export type NewOrderPage = {
  items: NewOrderItem[]
  /** The categories items are in, in the bakery's order — the picker's chips. */
  categories: { slug: string; name: string }[]
  /** Today … today + orderAheadDays, with live and verified counts. Its `paused` is the website's and is ignored here. */
  window: BookingWindow
  /** Pickup times ("HH:MM") per date, from that weekday's opening hours. */
  slots: Record<IsoDate, string[]>
  /** Settings' delivery fee — the form's starting fee, which staff may change. */
  deliveryFeePaise: number
  /** The day to start on: `?date=` when it's in the window (closed or not), else the first open day after today with room. */
  date: IsoDate | null
  /** `?customer=` — their phone and name are filled in. */
  customer: CustomerLookup | null
}

export async function loadNewOrder(params: { date?: string; customer?: string }): Promise<NewOrderPage> {
  const settings = await getSettings()
  const [window, rows, categories, customer] = await Promise.all([
    loadBookingWindow(settings, new Date()),
    prisma.menuItem.findMany({
      where: { isActive: true, archivedAt: null },
      select: { id: true, name: true, images: true, basePricePaise: true, priceUnit: true, orderable: true, noticeDays: true, category: true },
    }),
    prisma.menuCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true, name: true } }),
    params.customer ? lookupCustomer({ id: params.customer }) : Promise.resolve(null),
  ])

  const items = catalogueOrder(rows, categories).map(
    (row): NewOrderItem => ({
      id: row.id,
      name: row.name,
      images: row.images,
      pricePaise: row.basePricePaise,
      unit: asPriceUnit(row.priceUnit),
      orderable: row.orderable,
      noticeDays: row.noticeDays,
      category: row.category,
    }),
  )
  const used = new Set(items.map((item) => item.category))

  // A day the owner opened against the usual hours still gets times to pick from — the default day's.
  const hours = parseOpeningHours(settings.openingHours) ?? DEFAULT_HOURS
  const slots: Record<IsoDate, string[]> = {}
  for (const day of window.days) {
    const key = weekdayKey(weekday(day.date))
    slots[day.date] = pickupSlots(hours[key].open ? hours[key] : DEFAULT_HOURS[key])
  }

  const asked = params.date && isIsoDate(params.date) ? window.days.find((day) => day.date === params.date) : undefined
  const bookable = window.days.filter((day) => day.isOpen)
  const start = asked ?? bookable.find((day) => day.date > window.today && staffRoom(day) > 0) ?? bookable[0] ?? null

  return {
    items,
    categories: categories.filter((category) => used.has(category.slug)),
    window,
    slots,
    deliveryFeePaise: settings.deliveryFeePaise,
    date: start?.date ?? null,
    customer,
  }
}
