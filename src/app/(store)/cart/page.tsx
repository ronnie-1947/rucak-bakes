import type { Metadata } from "next"
import { Cart } from "@/components/cart/Cart"
import { htmlLang } from "@/lib/content"
import { getDictionary, type Locale } from "@/lib/i18n"
import { loadCartPage } from "@/lib/storefront/cart"
import { fill } from "@/lib/template"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: fill(dict.store.cart.metaTitle, { bakery: dict.meta.home.title }), robots: { index: false } }
}

/** Rendered per request — the days' capacity moves with every order. The cart's own lines are checked from the browser. */
export default async function CartPage() {
  const [dict, data] = await Promise.all([getDictionary(locale), loadCartPage()])

  return (
    <div lang={htmlLang(locale)} className="contents">
      <Cart data={data} dict={dict.store} />
    </div>
  )
}
