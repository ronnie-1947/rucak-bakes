import { parseOpeningHours } from "@/lib/settings/hours"
import { getSettings } from "@/lib/settings/row"
import { socialUrl } from "@/lib/settings/social"
import type { StoreBanner, StoreInfo, StoreSocial } from "./types"

/** Read model for the frame around every customer screen (src/components/store-shell/). */

export type StoreShellData = {
  bakeryName: string
  /** The first line of the pickup address — "Pickup at …" under the name. */
  place: string | null
  banner: StoreBanner | null
  /** Pickup, delivery, the phone and the timezone — the cart reads them from the shell (hooks/useStoreInfo). */
  info: StoreInfo
  /** Instagram and Facebook for the header's contact squares. */
  social: StoreSocial
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
  // Prerendered with every store page; the settings actions revalidate it. Nothing here moves with the clock or with orders.
  const settings = await getSettings()
  return {
    bakeryName: settings.bakeryName,
    place: firstLine(settings.pickupAddress),
    banner: storeBanner(settings),
    info: {
      timeZone: settings.timezone,
      pickup: {
        enabled: settings.pickupEnabled,
        address: (settings.pickupAddress ?? "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        hours: parseOpeningHours(settings.openingHours),
      },
      delivery: { enabled: settings.deliveryEnabled, feePaise: settings.deliveryFeePaise, radiusKm: settings.deliveryRadiusKm },
      phone: settings.publicPhone,
    },
    social: { instagram: socialUrl("instagram", settings.instagram), facebook: socialUrl("facebook", settings.facebook) },
  }
}
