import { todayIn, type IsoDate } from "@/lib/dates"
import { getSettings } from "@/lib/settings/row"
import type { StoreBanner } from "./types"

/** Read model for the frame around every customer screen (src/components/store-shell/). */

export type StoreShellData = {
  bakeryName: string
  /** The first line of the pickup address — "Pickup at …" under the name. */
  place: string | null
  banner: StoreBanner | null
  /** Bakery-local — the cart is cleared once its day is before this. */
  today: IsoDate
}

export function firstLine(text: string | null): string | null {
  return text?.split("\n")[0].trim() || null
}

export function storeBanner(settings: { orderingPaused: boolean; orderingPausedReason: string | null; announcement: string | null }): StoreBanner | null {
  if (settings.orderingPaused) return { kind: "paused", reason: settings.orderingPausedReason?.trim() || null }
  const text = settings.announcement?.trim()
  return text ? { kind: "note", text } : null
}

export async function loadStoreShell(): Promise<StoreShellData> {
  // Static on / (the settings actions revalidate it); the item page and the cart render per request through their own read models.
  const settings = await getSettings()
  return {
    bakeryName: settings.bakeryName,
    place: firstLine(settings.pickupAddress),
    banner: storeBanner(settings),
    today: todayIn(settings.timezone),
  }
}
