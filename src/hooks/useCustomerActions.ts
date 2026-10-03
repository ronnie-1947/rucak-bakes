"use client"

import { createContext, useContext } from "react"
import type { FlagChange } from "@/lib/customers/changes"

/** Who a flag change is about — the confirm names them and their number. */
export type CustomerTarget = { id: string; name: string; phoneDisplay: string }

export type CustomerActionsApi = {
  /** Ask for a flag change. Every one confirms first, saying what it does; the undo strip follows. */
  request: (change: FlagChange, target: CustomerTarget) => void
  /** A change is in flight. */
  pending: boolean
  /** For CustomerActionsStatus — the undo strip and the failure notice, wherever the screen puts them. */
  status: { undo: string | null; failed: boolean; revert: () => void; dismiss: () => void }
}

export const CustomerActionsContext = createContext<CustomerActionsApi | null>(null)

/** Inside a CustomerActionsProvider (src/components/customer-actions/). */
export function useCustomerActions(): CustomerActionsApi {
  const api = useContext(CustomerActionsContext)
  if (!api) throw new Error("useCustomerActions must be used inside <CustomerActionsProvider>")
  return api
}
