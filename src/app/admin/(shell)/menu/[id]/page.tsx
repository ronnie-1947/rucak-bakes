import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AdminMenuItem } from "@/components/admin-menu-item/AdminMenuItem"
import { prisma } from "@/lib/db"
import { getDictionary, type Locale } from "@/lib/i18n"
import { loadMenuItemPage } from "@/lib/menu/item"

const locale: Locale = "en"

export async function generateMetadata({ params }: PageProps<"/admin/menu/[id]">): Promise<Metadata> {
  const { id } = await params
  const [dict, item] = await Promise.all([getDictionary(locale), prisma.menuItem.findUnique({ where: { id }, select: { name: true } })])
  return { title: item?.name ?? dict.admin.menuItem.untitled }
}

export default async function MenuItemPage({ params, searchParams }: PageProps<"/admin/menu/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const [dict, page] = await Promise.all([getDictionary(locale), loadMenuItemPage(id)])
  if (!page) notFound()
  return <AdminMenuItem dict={dict.admin} page={page} justCreated={query.created === "1"} />
}
