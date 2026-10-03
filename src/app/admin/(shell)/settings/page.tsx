import type { Metadata } from "next"
import { AdminSettings } from "@/components/admin-settings/AdminSettings"
import { getDictionary, type Locale } from "@/lib/i18n"
import { loadSettingsPage } from "@/lib/settings/queries"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: dict.admin.settings.metaTitle }
}

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  const [dict, data] = await Promise.all([getDictionary(locale), loadSettingsPage(await searchParams)])
  return <AdminSettings dict={dict.admin} data={data} />
}
