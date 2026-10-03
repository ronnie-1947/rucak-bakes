"use client"

import { createContext, useContext } from "react"
import type { Tick, TickKind } from "@/lib/daysheet/tick"

export type DaySheetApi = {
  /** The row's state, with this device's in-flight taps applied. */
  isDone: (kind: TickKind, id: string) => boolean
  /** Flip a row. No confirm — the undo line that follows is the way back. */
  toggle: (tick: Tick) => void
  /** A past day: shown as it was left. */
  readOnly: boolean
  /** For TickProgress — the undo line and the failure notice, under the list the change was made in. */
  status: {
    undo: { kind: TickKind; text: string } | null
    failed: { kind: TickKind; past: boolean } | null
    pending: boolean
    revert: () => void
    dismiss: () => void
  }
}

export const DaySheetContext = createContext<DaySheetApi | null>(null)

/** Inside a DaySheetProvider (src/components/admin-daysheet/). */
export function useDaySheet(): DaySheetApi {
  const api = useContext(DaySheetContext)
  if (!api) throw new Error("useDaySheet must be used inside <DaySheetProvider>")
  return api
}
