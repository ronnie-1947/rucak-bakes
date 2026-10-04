import type { IsoDate } from "@/lib/dates"

/** Customer item page URLs. Client-safe. */

/** `?day=2026-10-04` — the pickup day the item page opens on. */
export const DAY_PARAM = "day"

/** "/menu/cardamom-bun", or "/menu/cardamom-bun?day=2026-10-04" to open on the day the link came from. */
export function itemHref(slug: string, day?: IsoDate | null): string {
  return day ? `/menu/${slug}?${DAY_PARAM}=${day}` : `/menu/${slug}`
}
