import type { Metadata } from "next"
import { Cart } from "@/components/cart/Cart"
import { htmlLang } from "@/lib/content"
import { getDictionary, type Locale } from "@/lib/i18n"
import { fill } from "@/lib/template"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: fill(dict.store.cart.metaTitle, { bakery: dict.meta.home.title }), robots: { index: false } }
}

/** Static — the shell (with pickup, delivery and the phone) and a skeleton. The days' capacity moves with every order: the browser's checkCart brings it. */
export default async function CartPage() {
  const dict = await getDictionary(locale)

  return (
    <div lang={htmlLang(locale)} className="contents">
      <Cart dict={dict.store} />
    </div>
  )
}
