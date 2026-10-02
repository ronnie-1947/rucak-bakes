import type { Metadata } from "next"
import { AdminOrders } from "@/components/admin-orders/AdminOrders"
import { getDictionary, type Locale } from "@/lib/i18n"
import { parseFilters } from "@/lib/orders/filters"
import { loadOrderDetail, loadOrderQueue } from "@/lib/orders/queries"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: dict.admin.orders.metaTitle }
}

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const filters = parseFilters(await searchParams)
  const [dict, queue, pane] = await Promise.all([
    getDictionary(locale),
    loadOrderQueue(filters),
    filters.order ? loadOrderDetail(filters.order) : Promise.resolve(null),
  ])

  return <AdminOrders dict={dict.admin} queue={queue} filters={filters} pane={pane} />
}
