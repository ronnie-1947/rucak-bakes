import { connection } from "next/server"
import { prisma } from "@/lib/db"
import type { CartCheck } from "@/lib/cart/check"
import { loadBookingWindow } from "@/lib/orders/booking"
import type { BookingWindow } from "@/lib/orders/deadline"
import { type OpeningHours, parseOpeningHours } from "@/lib/settings/hours"
import { getSettings } from "@/lib/settings/row"

/**
 * Read models for the cart (/cart). The cart itself lives in the browser, so the page gets what doesn't depend
 * on it — the booking window, how the bakery hands orders over — and `checkCart` (actions/checkout.ts) checks the
 * cart's own lines against the menu once the browser has read them.
 */

export type CartPageData = {
  /** Every date from today to the end of the order-ahead window, closed ones included, judged at render time. */
  window: BookingWindow
  pickup: {
    enabled: boolean
    /** The pickup address, one entry per line. */
    address: string[]
    /** Null until the owner first saves them. */
    hours: OpeningHours | null
  }
  delivery: { enabled: boolean; feePaise: number; radiusKm: number | null }
  /** E.164, or null when the owner hasn't given one. */
  phone: string | null
}

export async function loadCartPage(): Promise<CartPageData> {
  // Orders taken move with every order: never prerender this.
  await connection()
  const settings = await getSettings()
  return {
    window: await loadBookingWindow(settings, new Date()),
    pickup: {
      enabled: settings.pickupEnabled,
      address: (settings.pickupAddress ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      hours: parseOpeningHours(settings.openingHours),
    },
    delivery: { enabled: settings.deliveryEnabled, feePaise: settings.deliveryFeePaise, radiusKm: settings.deliveryRadiusKm },
    phone: settings.publicPhone,
  }
}

/**
 * The cart's lines as the menu has them now — orderable or not, the price, the notice — and the booking window to judge the
 * cart's day by. An inactive, archived or call-only item can't be ordered online: placeOrder refuses it.
 */
export async function checkLines(ids: string[]): Promise<CartCheck> {
  const settings = await getSettings()
  const [items, window] = await Promise.all([
    prisma.menuItem.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        slug: true,
        name: true,
        images: true,
        basePricePaise: true,
        isActive: true,
        archivedAt: true,
        orderable: true,
        noticeDays: true,
      },
    }),
    loadBookingWindow(settings, new Date()),
  ])
  const byId = new Map(items.map((item) => [item.id, item]))
  return {
    window,
    lines: ids.flatMap((id) => {
      const item = byId.get(id)
      if (!item) return []
      return [
        {
          menuItemId: id,
          slug: item.slug,
          name: item.name,
          image: item.images[0] ?? null,
          orderable: item.isActive && !item.archivedAt && item.orderable,
          pricePaise: item.basePricePaise,
          noticeDays: item.noticeDays,
        },
      ]
    }),
  }
}
