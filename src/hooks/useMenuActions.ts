"use client"

import { createContext, useContext } from "react"
import type { ScheduledDay } from "@/lib/menu/queries"

/** What a menu change needs to name items in a confirm dialog and the undo line. */
export type ItemTarget = { id: string; name: string; upcoming: ScheduledDay[] }

export type MenuActionKind = "activate" | "deactivate" | "archive" | "restore" | "duplicate"

/** The line the last change left: what happened, and an optional way on ("Open it" for a duplicate). */
export type UndoLine = { text: string; link?: { href: string; label: string } }

export type MenuActionsApi = {
  /**
   * Ask for a change. Archive always confirms; deactivate confirms when an item is on an upcoming day.
   * `onDone` runs once the change has landed (e.g. leave selection mode).
   */
  request: (kind: MenuActionKind, targets: ItemTarget[], onDone?: () => void) => void
  /** A change is in flight. */
  pending: boolean
  /** For MenuActionsStatus — the undo strip and the failure notice, wherever the screen puts them. */
  status: { undo: UndoLine | null; failed: boolean; revert: () => void; dismiss: () => void }
}

export const MenuActionsContext = createContext<MenuActionsApi | null>(null)

/** Inside a MenuActionsProvider (src/components/menu-actions/). */
export function useMenuActions(): MenuActionsApi {
  const api = useContext(MenuActionsContext)
  if (!api) throw new Error("useMenuActions must be used inside <MenuActionsProvider>")
  return api
}
