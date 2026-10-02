import type { Metadata } from "next"
import { AdminMenu } from "@/components/admin-menu/AdminMenu"
import { getDictionary, type Locale } from "@/lib/i18n"
import { parseMenuFilters } from "@/lib/menu/filters"
import { loadMenuLibrary } from "@/lib/menu/queries"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: dict.admin.menu.metaTitle }
}

export default async function MenuPage({ searchParams }: PageProps<"/admin/menu">) {
  const filters = parseMenuFilters(await searchParams)
  const [dict, library] = await Promise.all([getDictionary(locale), loadMenuLibrary(filters)])

  return <AdminMenu dict={dict.admin} library={library} filters={filters} />
}
