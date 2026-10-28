import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/site"
import { activeItems } from "@/lib/storefront/item"
import { itemHref } from "@/lib/storefront/routes"

/** /sitemap.xml — the landing page and every active item. Static; the menu actions revalidate it. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await activeItems()
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    ...items.map((item) => ({ url: absoluteUrl(itemHref(item.slug)), lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ]
}
