import type { TagTone } from "@/components/ui/Tag"
import type { IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import { formatPaise } from "@/lib/money"
import type { StoreItem } from "@/lib/storefront/types"
import type { DayWords } from "@/lib/storefront/words"
import { fill } from "@/lib/template"

/** What a customer card shows besides the item itself. Client-safe. */

export type ItemChip = { text: string; tone: TagTone }

/** Add to cart's words — the button, its name, "For tomorrow" under the stepper, the stepper's labels, the status line. */
export type AddCopy = {
  add: string
  addLabel: string
  forDay: string
  inCart: string
  decrease: string
  increase: string
  days: DayWords
}

/**
 * The card's button: `add` puts one in the cart for the cart's day when the item can be had then, else for the earliest
 * date it can (`dates`, never empty) · `call` rings the bakery.
 */
export type CardAction =
  | { look: "add"; dates: IsoDate[]; today: IsoDate; copy: AddCopy }
  | { look: "call"; label: string; ariaLabel: string; phone: string }

/** "₹240" and, when it isn't per piece, "per box". A call-only item reads "from ₹1,500" — the base is where it starts. */
export function priceParts(
  item: Pick<StoreItem, "pricePaise" | "priceUnit" | "orderable">,
  dict: Dict["store"]["item"],
): { price: string; unit: string } {
  const price = formatPaise(item.pricePaise)
  return { price: item.orderable ? price : fill(dict.from, { price }), unit: dict.units[item.priceUnit] }
}
