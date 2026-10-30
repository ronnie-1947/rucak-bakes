import type { Metadata } from "next"
import { Credit } from "@/app/sections/landing/credit/Credit"
import { FreshToday } from "@/app/sections/landing/fresh-today/FreshToday"
import { Hero } from "@/app/sections/landing/hero/Hero"
import { Menu } from "@/app/sections/landing/menu/Menu"
import { VisitUs } from "@/app/sections/landing/visit-us/VisitUs"
import { htmlLang } from "@/lib/content"
import { getDictionary, type Locale } from "@/lib/i18n"
import { loadLanding } from "@/lib/storefront/landing"

const locale: Locale = "en"

export const metadata: Metadata = { alternates: { canonical: "/" } }

/** Prerendered, and only re-rendered when a menu, calendar, settings or order write revalidates "/". The cart and placeOrder check again. */
export default async function Home() {
  const [dict, data] = await Promise.all([getDictionary(locale), loadLanding()])

  return (
    <div lang={htmlLang(locale)}>
      <Hero hero={data.hero} phone={data.visit.phone} dict={dict.landing.hero} />
      {data.fresh ? <FreshToday fresh={data.fresh} hasPhone={Boolean(data.visit.phone)} dict={dict.landing.freshToday} store={dict.store} /> : null}
      <Menu
        catalogue={data.catalogue}
        categories={data.categories}
        phone={data.visit.phone}
        today={data.today}
        dict={dict.landing.menu}
        store={dict.store}
      />
      <VisitUs visit={data.visit} dict={dict.landing.visitUs} />
      <Credit dict={dict.landing.credit} />
    </div>
  )
}
