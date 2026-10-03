import type { Metadata } from "next"
import { AdminCustomers } from "@/components/admin-customers/AdminCustomers"
import { loadCustomerDetail } from "@/lib/customers/detail"
import { parseCustomerFilters } from "@/lib/customers/filters"
import { loadCustomerList } from "@/lib/customers/queries"
import { getDictionary, type Locale } from "@/lib/i18n"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: dict.admin.customers.metaTitle }
}

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const filters = parseCustomerFilters(await searchParams)
  const [dict, list, pane] = await Promise.all([
    getDictionary(locale),
    loadCustomerList(filters),
    filters.customer ? loadCustomerDetail(filters.customer) : Promise.resolve(null),
  ])

  return <AdminCustomers dict={dict.admin} list={list} filters={filters} pane={pane} />
}
