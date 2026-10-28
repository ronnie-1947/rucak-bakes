/**
 * The public origin, for the URLs that must be absolute: canonical links, Open Graph images, structured data, the sitemap.
 * SITE_URL when it's set (the bakery's own domain); on Vercel, the production domain Vercel sets; else the dev server.
 */
export function siteUrl(): URL {
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL)
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  return new URL(vercel ? `https://${vercel}` : "http://localhost:3000")
}

/** "/menu/cardamom-bun" → "https://…/menu/cardamom-bun". */
export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).href
}
