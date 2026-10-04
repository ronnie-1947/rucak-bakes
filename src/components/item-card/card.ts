import type { TagTone } from "@/components/ui/Tag"
import type { Dict } from "@/lib/i18n"
import { formatPaise } from "@/lib/money"
import type { StoreItem } from "@/lib/storefront/types"
import { fill } from "@/lib/template"

/** What a customer card shows besides the item itself. Client-safe. */

export type ItemChip = { text: string; tone: TagTone }

/** The card's button: `choose` opens the item page to pick a date · `call` rings the bakery (or opens the page without a phone). */
export type CardAction = { look: "choose" | "call"; label: string; ariaLabel: string; href: string }

/** "₹240" and, when it isn't per piece, "per box". A call-only item reads "from ₹1,500" — the base is where it starts. */
export function priceParts(
  item: Pick<StoreItem, "pricePaise" | "priceUnit" | "orderable">,
  dict: Dict["store"]["item"],
): { price: string; unit: string } {
  const price = formatPaise(item.pricePaise)
  return { price: item.orderable ? price : fill(dict.from, { price }), unit: dict.units[item.priceUnit] }
}
