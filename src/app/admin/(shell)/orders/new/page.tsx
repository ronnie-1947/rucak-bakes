import type { Metadata } from "next"
import { AdminNewOrder } from "@/components/admin-new-order/AdminNewOrder"
import { getDictionary, type Locale } from "@/lib/i18n"
import { loadNewOrder } from "@/lib/orders/new-order"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: dict.admin.newOrder.metaTitle }
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/** `?date=2026-10-10` starts on that day (the day editor's Add order); `?customer=<id>` fills in their phone and name. */
export default async function NewOrderPage({ searchParams }: PageProps<"/admin/orders/new">) {
  const params = await searchParams
  const date = first(params.date)
  const customer = first(params.customer)
  const [dict, page] = await Promise.all([getDictionary(locale), loadNewOrder({ date, customer })])

  return <AdminNewOrder dict={dict.admin} page={page} formKey={`${date ?? ""}|${customer ?? ""}`} />
}
