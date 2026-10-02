import type { Metadata } from "next"
import { AdminMenuItem } from "@/components/admin-menu-item/AdminMenuItem"
import { getDictionary, type Locale } from "@/lib/i18n"
import { loadMenuItemPage } from "@/lib/menu/item"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: dict.admin.menuItem.metaTitleNew }
}

export default async function NewMenuItemPage() {
  const [dict, page] = await Promise.all([getDictionary(locale), loadMenuItemPage(null)])
  if (!page) throw new Error("The new-item form always loads")
  return <AdminMenuItem dict={dict.admin} page={page} justCreated={false} />
}
