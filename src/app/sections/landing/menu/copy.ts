import type { CardAction, ItemChip } from "@/components/item-card/card"
import type { Dict } from "@/lib/i18n"
import { itemHref } from "@/lib/storefront/routes"
import type { CatalogueItem } from "@/lib/storefront/types"
import { noticeChip } from "@/lib/storefront/words"
import { fill } from "@/lib/template"

/** What each card in "Everything we bake" carries, filled. */

type MenuCopy = Dict["landing"]["menu"]

/** The notice on the photo: "Same day", "Order by tomorrow", "Order 3 days ahead", "Made to order". */
export function menuChip(item: CatalogueItem, notice: Dict["store"]["notice"]): ItemChip {
  return { text: noticeChip(item.noticeDays, item.orderable, notice), tone: "plain" }
}

/** Choose date (its page, where the dates are), or Call to order — the page instead when the bakery has no public phone. */
export function menuAction(item: CatalogueItem, phone: string | null, dict: MenuCopy): CardAction {
  if (item.orderable) return { look: "choose", label: dict.choose, ariaLabel: fill(dict.chooseLabel, { name: item.name }), href: itemHref(item.slug) }
  return { look: "call", label: dict.call, ariaLabel: fill(dict.callLabel, { name: item.name }), href: phone ? `tel:${phone}` : itemHref(item.slug) }
}
