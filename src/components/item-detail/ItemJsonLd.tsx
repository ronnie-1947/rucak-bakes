import { imageUrl } from "@/lib/cloudinary"
import { absoluteUrl } from "@/lib/site"
import type { ItemPageData } from "@/lib/storefront/item"
import { itemHref } from "@/lib/storefront/routes"

type ItemJsonLdProps = {
  data: ItemPageData
}

/** Width of the photos named in the structured data — large enough for Google's image requirements. */
const PHOTO_WIDTH = 1200

/**
 * The item as a schema.org Product for search engines — name, photos, description, and an Offer in INR with the bakery as
 * seller when it can be ordered online at a set price (a call-only item or a blank price has no Offer). Rendered on the
 * server, in the static HTML; `<` is escaped so no text can close the script.
 */
export function ItemJsonLd({ data }: ItemJsonLdProps) {
  const { item } = data
  const url = absoluteUrl(itemHref(item.slug))
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.shortDescription || undefined,
    image: item.photos.length ? item.photos.map((photo) => imageUrl(photo.id, { w: PHOTO_WIDTH })) : undefined,
    url,
    offers:
      item.orderable && item.basePricePaise > 0
        ? {
            "@type": "Offer",
            price: (item.basePricePaise / 100).toFixed(2),
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            url,
            seller: { "@type": "Bakery", name: data.bakeryName, telephone: data.phone ?? undefined },
          }
        : undefined,
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, "\\u003c") }} />
}
