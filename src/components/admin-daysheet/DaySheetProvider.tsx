"use client"

import { type ReactNode, useCallback, useMemo, useOptimistic, useState, useTransition } from "react"
import { tickBaked, tickCollected } from "@/app/actions/daysheet"
import { type DaySheetApi, DaySheetContext } from "@/hooks/useDaySheet"
import { type Tick, tickKey } from "@/lib/daysheet/tick"
import type { IsoDate } from "@/lib/dates"
import { fill } from "@/lib/template"
import type { DaySheetCopy } from "./types"

type DaySheetProviderProps = {
  /** The sheet's day — a For orders tick covers every verified line of the item on it. */
  date: IsoDate
  /** Server truth: `tickKey(kind, id)` → done. Rebuilt on every refresh, so another device's ticks arrive with it. */
  ticks: Record<string, boolean>
  readOnly: boolean
  /** The orders this render was built from (`SheetVersion.orders`, joined) — a refresh that brings new ones clears `stale`. */
  version: string
  dict: DaySheetCopy
  children: ReactNode
}

type Done = Tick & { done: boolean }

/**
 * Owns every tick — baked (For orders, Made to order, counter-items) and collected. A tap shows at once (useOptimistic)
 * and persists through the server action, which revalidates — so the next render's `ticks` already carry it. No confirm
 * dialog: the green undo line under the list is the way back, and undo is just the same tick the other way.
 * Also whether the orders are stale, for the printout: kept against the version it was seen on, so a refresh clears it.
 */
export function DaySheetProvider({ date, ticks, readOnly, version, dict, children }: DaySheetProviderProps) {
  const [shown, show] = useOptimistic(ticks, (state, change: { key: string; done: boolean }) => ({ ...state, [change.key]: change.done }))
  const [staleFor, setStaleFor] = useState<string | null>(null)
  const markStale = useCallback(() => setStaleFor(version), [version])
  const [undo, setUndo] = useState<Done | null>(null)
  const [failed, setFailed] = useState<{ kind: Tick["kind"]; past: boolean } | null>(null)
  const [pending, startTransition] = useTransition()

  const send = useCallback(
    (tick: Tick, done: boolean, after: (ok: boolean) => void) => {
      startTransition(async () => {
        show({ key: tickKey(tick.kind, tick.id), done })
        const result =
          tick.kind === "collect" ? await tickCollected({ id: tick.id, done }) : await tickBaked({ kind: tick.kind, id: tick.id, date, done })
        if (result.ok) {
          setFailed(null)
          after(true)
        } else {
          setFailed({ kind: tick.kind, past: result.reason === "PAST" })
          after(false)
        }
      })
    },
    [date, show],
  )

  const toggle = useCallback(
    (tick: Tick) => {
      if (readOnly) return
      const done = !shown[tickKey(tick.kind, tick.id)]
      send(tick, done, (ok) => setUndo(ok ? { ...tick, done } : null))
    },
    [readOnly, shown, send],
  )

  const revert = useCallback(() => {
    if (!undo) return
    send(undo, !undo.done, (ok) => {
      if (ok) setUndo(null)
    })
  }, [undo, send])

  const dismiss = useCallback(() => setUndo(null), [])

  const undoText = useMemo(() => {
    if (!undo) return null
    const [undone, doneText] = undo.kind === "collect" ? [dict.undoneCollect, dict.doneCollect] : [dict.undoneBake, dict.doneBake]
    return { kind: undo.kind, text: fill(undo.done ? doneText : undone, { name: undo.label }) }
  }, [undo, dict])

  const api = useMemo<DaySheetApi>(
    () => ({
      isDone: (kind, id) => Boolean(shown[tickKey(kind, id)]),
      toggle,
      readOnly,
      stale: staleFor === version,
      markStale,
      status: { undo: undoText, failed, pending, revert, dismiss },
    }),
    [shown, toggle, readOnly, staleFor, version, markStale, undoText, failed, pending, revert, dismiss],
  )

  return <DaySheetContext.Provider value={api}>{children}</DaySheetContext.Provider>
}
