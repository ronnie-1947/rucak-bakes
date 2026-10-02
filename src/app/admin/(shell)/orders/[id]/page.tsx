import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { OrderDetail } from "@/components/admin-order-detail/OrderDetail"
import { getDictionary, type Locale } from "@/lib/i18n"
import { loadOrderDetail } from "@/lib/orders/queries"
import { fill } from "@/lib/template"

const locale: Locale = "en"

export async function generateMetadata({ params }: PageProps<"/admin/orders/[id]">): Promise<Metadata> {
  const [{ id }, dict] = await Promise.all([params, getDictionary(locale)])
  const order = await loadOrderDetail(id)
  return { title: order ? fill(dict.admin.orderDetail.metaTitle, { code: order.code }) : dict.admin.orders.metaTitle }
}

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params
  const [dict, order] = await Promise.all([getDictionary(locale), loadOrderDetail(id)])
  if (!order) notFound()

  return <OrderDetail order={order} dict={dict.admin} variant="page" backHref="/admin/orders" />
}
