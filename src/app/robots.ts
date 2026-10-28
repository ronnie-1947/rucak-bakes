import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/site"

/** /robots.txt — the store is open to crawlers; the staff screens, the cart and the data routes aren't pages to index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/cart", "/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
