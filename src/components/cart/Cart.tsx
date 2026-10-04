import type { Dict } from "@/lib/i18n"
import type { CartPageData } from "@/lib/storefront/cart"
import { CartFlow } from "./CartFlow"
import type { CartPageCopy } from "./copy"

type CartProps = {
  data: CartPageData
  dict: Dict["store"]
}

/** The cart (/cart). The cart itself is in the browser, so the whole flow is one client component; this hands it only the strings it uses. */
export function Cart({ data, dict }: CartProps) {
  const copy: CartPageCopy = {
    cart: dict.cart,
    days: dict.days,
    notice: dict.notice,
    shell: dict.shell,
    item: { decrease: dict.item.decrease, increase: dict.item.increase },
  }
  return <CartFlow data={data} copy={copy} />
}
