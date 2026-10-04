import type { Dict } from "@/lib/i18n"
import { fill } from "@/lib/template"

export type StoreCopy = Dict["store"]

/** What the client-side cart frame needs — not the item strings, which stay on the server. */
export type CartCopy = Pick<StoreCopy, "shell" | "switchDay" | "days">

/** "1 item" / "3 items" — counts units, not lines. */
export function itemsText(count: number, dict: StoreCopy["shell"]): string {
  return count === 1 ? dict.itemsOne : fill(dict.items, { count })
}

/** The header button's accessible name: "Cart", "Cart, 1 item", "Cart, 3 items". */
export function cartLabel(count: number, dict: StoreCopy["shell"]): string {
  if (count === 0) return dict.cart
  return count === 1 ? dict.cartCountOne : fill(dict.cartCount, { count })
}
