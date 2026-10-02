"use client"

import { createContext, useContext } from "react"
import type { ScheduledDay } from "@/lib/menu/queries"

/** What a menu change needs to name items in a confirm dialog and the undo line. */
export type ItemTarget = { id: string; name: string; upcoming: ScheduledDay[] }

export type MenuActionKind = "activate" | "deactivate" | "archive" | "restore" | "duplicate"

export type MenuActionsApi = {
  /**
   * Ask for a change. Archive always confirms; deactivate confirms when an item is on an upcoming day.
   * `onDone` runs once the change has landed (e.g. leave selection mode).
   */
  request: (kind: MenuActionKind, targets: ItemTarget[], onDone?: () => void) => void
  /** A change is in flight. */
  pending: boolean
}

export const MenuActionsContext = createContext<MenuActionsApi | null>(null)

/** Inside a MenuActionsProvider (src/components/admin-menu/). */
export function useMenuActions(): MenuActionsApi {
  const api = useContext(MenuActionsContext)
  if (!api) throw new Error("useMenuActions must be used inside <MenuActionsProvider>")
  return api
}
