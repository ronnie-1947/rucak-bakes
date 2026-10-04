import { DayStrip } from "@/app/sections/landing/day-strip/DayStrip"
import { Hero } from "@/app/sections/landing/hero/Hero"
import { HowItWorks } from "@/app/sections/landing/how-it-works/HowItWorks"
import { MenuGrid } from "@/app/sections/landing/menu-grid/MenuGrid"
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
      <DayStrip days={data.days} today={data.today} dict={dict.landing.dayStrip} store={dict.store} />
      <HowItWorks dict={dict.landing.howItWorks} />
      <MenuGrid catalogue={data.catalogue} days={data.days} today={data.today} dict={dict.landing.menuGrid} store={dict.store} />
      <VisitUs visit={data.visit} dict={dict.landing.visitUs} />
    </div>
  )
}
