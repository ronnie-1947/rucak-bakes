import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AdminCustomerDetail } from "@/components/admin-customer-detail/AdminCustomerDetail"
import { loadCustomerDetail } from "@/lib/customers/detail"
import { prisma } from "@/lib/db"
import { getDictionary, type Locale } from "@/lib/i18n"
import { fill } from "@/lib/template"

const locale: Locale = "en"

export async function generateMetadata({ params }: PageProps<"/admin/customers/[id]">): Promise<Metadata> {
  const { id } = await params
  const [dict, customer] = await Promise.all([getDictionary(locale), prisma.customer.findUnique({ where: { id }, select: { name: true } })])
  return { title: customer ? fill(dict.admin.customerDetail.metaTitle, { name: customer.name }) : dict.admin.customers.metaTitle }
}

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params
  const [dict, customer] = await Promise.all([getDictionary(locale), loadCustomerDetail(id)])
  if (!customer) notFound()
  return <AdminCustomerDetail dict={dict.admin} customer={customer} />
}
