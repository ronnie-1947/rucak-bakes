"use client"

import { createContext, useContext } from "react"
import type { StoreInfo } from "@/lib/storefront/types"

export const StoreInfoContext = createContext<StoreInfo | null>(null)

/** Pickup, delivery, the phone and the timezone, from the static store shell. Inside a StoreInfoProvider (src/components/store-shell/). */
export function useStoreInfo(): StoreInfo {
  const info = useContext(StoreInfoContext)
  if (!info) throw new Error("useStoreInfo must be used inside <StoreInfoProvider>")
  return info
}
