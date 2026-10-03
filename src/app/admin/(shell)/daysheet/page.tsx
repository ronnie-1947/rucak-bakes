import type { Metadata } from "next"
import { AdminDaySheet } from "@/components/admin-daysheet/AdminDaySheet"
import { loadDaySheet } from "@/lib/daysheet/queries"
import { getDictionary, type Locale } from "@/lib/i18n"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: dict.admin.daysheet.metaTitle }
}

export default async function DaySheetPage({ searchParams }: PageProps<"/admin/daysheet">) {
  const [dict, data] = await Promise.all([getDictionary(locale), loadDaySheet(await searchParams)])
  return <AdminDaySheet dict={dict.admin} data={data} />
}
