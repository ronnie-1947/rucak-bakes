import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ItemDetail } from "@/components/item-detail/ItemDetail"
import { imageUrl } from "@/lib/cloudinary"
import { htmlLang } from "@/lib/content"
import { getDictionary, type Locale } from "@/lib/i18n"
import { activeItems, loadItemPage } from "@/lib/storefront/item"
import { itemHref } from "@/lib/storefront/routes"
import { fill } from "@/lib/template"

const locale: Locale = "en"

/** The share card — Open Graph's 1.91:1 at 1200 wide. */
const OG = { w: 1200, h: 628, ar: "1.91" }

/** Every active item is prerendered at build; one added later is prerendered on its first visit. Menu changes revalidate them all. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await activeItems()).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<"/menu/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const [dict, data] = await Promise.all([getDictionary(locale), loadItemPage(slug)])
  if (!data) return { title: dict.meta.home.title }
  const { item } = data
  const title = fill(dict.store.itemPage.metaTitle, { name: item.name, bakery: dict.meta.home.title })
  const description = item.shortDescription || undefined
  const cover = item.photos[0]
  return {
    title,
    description,
    alternates: { canonical: itemHref(item.slug) },
    openGraph: {
      type: "website",
      siteName: dict.meta.home.title,
      locale: "en_IN",
      url: itemHref(item.slug),
      title,
      description,
      images: cover ? [{ url: imageUrl(cover.id, { w: OG.w, ar: OG.ar }), width: OG.w, height: OG.h, alt: cover.alt || item.name }] : undefined,
    },
    twitter: { card: cover ? "summary_large_image" : "summary", title, description },
  }
}

/**
 * Static (SSG) — the whole item, rendered on the server, so crawlers and link previews get it. Only the order area's dates
 * and today's counter move with orders and the clock: the browser fetches those (GET /api/menu/[slug]).
 */
export default async function ItemRoute({ params }: PageProps<"/menu/[slug]">) {
  const { slug } = await params
  const [dict, data] = await Promise.all([getDictionary(locale), loadItemPage(slug)])
  if (!data) notFound()

  return (
    <div lang={htmlLang(locale)}>
      <ItemDetail data={data} dict={dict.store} />
    </div>
  )
}
