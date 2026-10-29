import type { Metadata } from "next"
import { OfflineScreen } from "@/components/offline-screen/OfflineScreen"
import { htmlLang } from "@/lib/content"
import { getDictionary, type Locale } from "@/lib/i18n"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: dict.meta.offline.title, robots: { index: false } }
}

/** Static. public/sw.js stores it at install and serves it for any page that can't load. Never linked, not in the sitemap. */
export default async function OfflinePage() {
  const dict = await getDictionary(locale)

  return (
    <div lang={htmlLang(locale)} className="contents">
      <OfflineScreen dict={dict.offline} />
    </div>
  )
}
