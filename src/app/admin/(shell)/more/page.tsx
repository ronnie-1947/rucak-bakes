import type { Metadata } from "next"
import { AdminMore } from "@/components/admin-more/AdminMore"
import { getDictionary, type Locale } from "@/lib/i18n"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: dict.admin.more.metaTitle }
}

export default async function MorePage() {
  const dict = await getDictionary(locale)
  return <AdminMore dict={dict.admin} />
}
