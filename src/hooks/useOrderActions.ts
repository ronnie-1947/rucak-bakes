"use client"

import { createContext, useContext } from "react"
import type { OrderStatus } from "@/generated/prisma/enums"

/** What a status change needs to name the orders in a confirm dialog. */
export type ActionTarget = { id: string; code: string; name: string }

export type OrderActionsApi = {
  /**
   * Ask to move orders to `to`. Cancel and no-show open the reason dialog; verify may come back with the
   * over-capacity dialog. `onDone` runs once the change has landed (e.g. leave selection mode).
   */
  request: (targets: ActionTarget[], to: OrderStatus, onDone?: () => void) => void
  /** A change is in flight. */
  pending: boolean
}

export const OrderActionsContext = createContext<OrderActionsApi | null>(null)

/** Inside an OrderActionsProvider (src/components/order-actions/). */
export function useOrderActions(): OrderActionsApi {
  const api = useContext(OrderActionsContext)
  if (!api) throw new Error("useOrderActions must be used inside <OrderActionsProvider>")
  return api
}
