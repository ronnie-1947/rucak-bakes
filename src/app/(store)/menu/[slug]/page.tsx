import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ItemDetail } from "@/components/item-detail/ItemDetail"
import { htmlLang } from "@/lib/content"
import { getDictionary, type Locale } from "@/lib/i18n"
import { loadItem } from "@/lib/storefront/item"
import { DAY_PARAM } from "@/lib/storefront/routes"
import { fill } from "@/lib/template"

const locale: Locale = "en"

export async function generateMetadata({ params }: PageProps<"/menu/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const [dict, data] = await Promise.all([getDictionary(locale), loadItem(slug)])
  if (!data) return { title: dict.meta.home.title }
  return {
    title: fill(dict.store.itemPage.metaTitle, { name: data.item.name, bakery: dict.meta.home.title }),
    description: data.item.shortDescription || undefined,
  }
}

/** Rendered per request, like `/` — quantities left move with every order, and the store layout reads the clock. */
export default async function ItemPage({ params, searchParams }: PageProps<"/menu/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const [dict, data] = await Promise.all([getDictionary(locale), loadItem(slug)])
  if (!data) notFound()
  const day = query[DAY_PARAM]

  return (
    <div lang={htmlLang(locale)} className="contents">
      <ItemDetail data={data} day={typeof day === "string" ? day : undefined} dict={dict.store} />
    </div>
  )
}
