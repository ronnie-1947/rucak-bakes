"use client"

import type { ReactNode } from "react"
import { StoreInfoContext } from "@/hooks/useStoreInfo"
import type { StoreInfo } from "@/lib/storefront/types"

type StoreInfoProviderProps = {
  info: StoreInfo
  children: ReactNode
}

/** Hands the shell's StoreInfo to every customer screen (hooks/useStoreInfo) — the cart reads pickup, delivery and the phone from it. */
export function StoreInfoProvider({ info, children }: StoreInfoProviderProps) {
  return <StoreInfoContext value={info}>{children}</StoreInfoContext>
}
