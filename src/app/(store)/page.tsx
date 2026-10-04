import { FreshToday } from "@/app/sections/landing/fresh-today/FreshToday"
import { Hero } from "@/app/sections/landing/hero/Hero"
import { Menu } from "@/app/sections/landing/menu/Menu"
import { VisitUs } from "@/app/sections/landing/visit-us/VisitUs"
import { htmlLang } from "@/lib/content"
import { getDictionary, type Locale } from "@/lib/i18n"
import { loadLanding } from "@/lib/storefront/landing"

const locale: Locale = "en"

export default async function Home() {
  const [dict, data] = await Promise.all([getDictionary(locale), loadLanding()])

  return (
    <div lang={htmlLang(locale)} className="contents">
      <Hero hero={data.hero} dict={dict.landing.hero} />
      <FreshToday fresh={data.fresh} today={data.today} phone={data.visit.phone} dict={dict.landing.freshToday} store={dict.store} />
      <Menu catalogue={data.catalogue} categories={data.categories} phone={data.visit.phone} dict={dict.landing.menu} store={dict.store} />
      <VisitUs visit={data.visit} dict={dict.landing.visitUs} />
    </div>
  )
}
