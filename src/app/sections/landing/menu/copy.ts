import type { AddCopy, CardAction, ItemChip } from "@/components/item-card/card"
import type { IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import type { CatalogueItem } from "@/lib/storefront/types"
import { noticeChip } from "@/lib/storefront/words"
import { fill } from "@/lib/template"

/** What each card in "Everything we bake" carries, filled. */

type MenuCopy = Dict["landing"]["menu"]

/** The notice on the photo: "Same day", "Order by tomorrow", "Order 3 days ahead", "Made to order". */
export function menuChip(item: CatalogueItem, notice: Dict["store"]["notice"]): ItemChip {
  return { text: noticeChip(item.noticeDays, item.orderable, notice), tone: "plain" }
}

/** Add to cart's words — the band's, plus the item page's status lines and the cart's Remove. */
export function addCopy(dict: MenuCopy, store: Dict["store"]): AddCopy {
  return {
    add: dict.add,
    addLabel: dict.addLabel,
    quantity: dict.quantity,
    quantityLabel: dict.quantityLabel,
    forDay: dict.forDay,
    remove: store.cart.remove,
    removeLabel: store.cart.removeLabel,
    inCart: store.itemPage.inCart,
    inCartSized: store.itemPage.inCartSized,
    days: store.days,
  }
}

/**
 * Size chips and Add to cart while the item can be ordered online for a date in the window; otherwise — call only, or no
 * date open — Call to order, which rings the bakery. No button without a public phone: the card still opens the item page,
 * which says why.
 */
export function menuAction(item: CatalogueItem, phone: string | null, today: IsoDate, add: AddCopy, dict: MenuCopy): CardAction | undefined {
  if (item.dates.length > 0) return { look: "add", dates: item.dates, today, copy: add }
  if (!phone) return undefined
  return { look: "call", label: dict.call, ariaLabel: fill(dict.callLabel, { name: item.name }), phone }
}
