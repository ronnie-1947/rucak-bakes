import { prisma } from "@/lib/db"
import type { CartCheck } from "@/lib/cart/check"
import { soldByWeight } from "@/lib/menu/sizes"
import { asPriceUnit } from "@/lib/menu/units"
import { loadBookingWindow } from "@/lib/orders/booking"
import { getSettings } from "@/lib/settings/row"

/**
 * Read model for the cart (/cart). The cart itself lives in the browser and the page is static: pickup, delivery and the
 * phone come with the store shell (StoreInfo), and `checkCart` (actions/checkout.ts) brings the cart's own lines as the
 * menu has them, with the booking window, once the browser has read them.
 */

/**
 * The cart's lines as the menu has them now — orderable or not, the price, whether it's sold by weight, the notice — and the
 * booking window to judge the cart's day by. An inactive, archived or call-only item can't be ordered online: placeOrder
 * refuses it.
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
        priceUnit: true,
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
          byWeight: soldByWeight(asPriceUnit(item.priceUnit)),
          noticeDays: item.noticeDays,
        },
      ]
    }),
  }
}
