"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { saveMenuDay } from "@/app/actions/calendar"
import { type CutoffChoice, cutoffKey } from "@/lib/calendar/cutoffs"
import type { CopySource, DayEditorData } from "@/lib/calendar/day"
import { changeCount, DAY_QUANTITY, type DayPlan, overridePaise, overrideProblems, withMaxOrders } from "@/lib/calendar/form"
import type { DayOrder } from "@/lib/calendar/week"

/** Why the last save didn't land. */
export type SaveProblem = "failed" | "unavailable"

export type SaveState = "saved" | "prices" | "unsaved" | "clean"

const FLASH_MS = 1800

/**
 * Everything the day editor holds: the plan being edited against the saved one — its settings and its counter-items
 * (§10R) — which rows are open, the search and category, and Save / Discard. Counter-items never hold orders, so any of
 * them can change freely. Closing a day with orders goes through the confirm first; the save then tells the server it
 * was confirmed.
 */
export function useDayEditor(data: DayEditorData) {
  const [plan, setPlan] = useState<DayPlan>(data.saved)
  const [saved, setSaved] = useState<DayPlan>(data.saved)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [closing, setClosing] = useState<DayOrder[] | null>(null)
  const [closeConfirmed, setCloseConfirmed] = useState(false)
  const [flash, setFlash] = useState(false)
  const [problem, setProblem] = useState<SaveProblem | null>(null)
  const [pending, startTransition] = useTransition()
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const timer = flashTimer
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const basePrices = useMemo(() => Object.fromEntries(data.items.map((item) => [item.id, item.basePricePaise])), [data.items])
  const changes = useMemo(() => changeCount(plan, saved, basePrices), [plan, saved, basePrices])
  const priceIssues = useMemo(() => overrideProblems(plan, basePrices), [plan, basePrices])
  const dirty = changes > 0

  const saveState: SaveState = flash ? "saved" : priceIssues.length > 0 ? "prices" : dirty ? "unsaved" : "clean"
  const canSave = !data.isPast && !pending && dirty && priceIssues.length === 0

  // Unsaved work survives an accidental tab close or reload as a browser prompt.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const edit = useCallback((change: (current: DayPlan) => DayPlan) => {
    setFlash(false)
    setProblem(null)
    setPlan(change)
  }, [])

  const editItem = useCallback(
    (id: string, patch: Partial<DayPlan["items"][string]>) => edit((current) => ({ ...current, items: { ...current.items, [id]: { ...current.items[id], ...patch } } })),
    [edit],
  )

  // ── Day settings ──────────────────────────────────────────────────────────

  const setOpen = useCallback(
    (isOpen: boolean) => {
      if (!isOpen && saved.isOpen && data.liveOrders.length > 0 && !closeConfirmed) {
        setClosing(data.liveOrders)
        return
      }
      edit((current) => ({ ...current, isOpen }))
    },
    [closeConfirmed, data.liveOrders, edit, saved.isOpen],
  )

  const confirmClose = useCallback(() => {
    setClosing(null)
    setCloseConfirmed(true)
    edit((current) => ({ ...current, isOpen: false }))
  }, [edit])

  const setCutoff = useCallback((cutoff: CutoffChoice) => edit((current) => ({ ...current, cutoff })), [edit])
  const setMaxOrders = useCallback((max: number) => edit((current) => withMaxOrders(current, max)), [edit])
  const setOverbook = useCallback((overbookLimit: number) => edit((current) => ({ ...current, overbookLimit })), [edit])
  const setPublicNote = useCallback((publicNote: string) => edit((current) => ({ ...current, publicNote })), [edit])
  const setClosureNote = useCallback((closureNote: string) => edit((current) => ({ ...current, closureNote })), [edit])

  // ── Items ─────────────────────────────────────────────────────────────────

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  /** Ticking makes it a counter-item and opens its controls. */
  const toggleItem = useCallback(
    (id: string) => {
      const included = !plan.items[id].included
      editItem(id, { included })
      setExpanded((current) => {
        const next = new Set(current)
        if (included) next.add(id)
        else next.delete(id)
        return next
      })
    },
    [editItem, plan.items],
  )

  /** Select all / Clear all, over the rows the search and category leave visible. */
  const setAll = useCallback(
    (ids: string[], included: boolean) => {
      edit((current) => {
        const items = { ...current.items }
        for (const id of ids) items[id] = { ...items[id], included }
        return { ...current, items }
      })
      if (!included) setExpanded(new Set())
    },
    [edit],
  )

  const setQuantity = useCallback((id: string, quantity: number) => editItem(id, { quantity }), [editItem])
  /** Digits and one dot, as typed — checked as a price when saving. */
  const setOverride = useCallback((id: string, text: string) => editItem(id, { override: text.replace(/[^\d.]/g, "").slice(0, 9) }), [editItem])
  /** The counter ran out — or didn't after all. The quantity made stays as it was. */
  const toggleSoldOut = useCallback((id: string) => editItem(id, { soldOut: !plan.items[id].soldOut }), [editItem, plan.items])

  /** "Copy from another day": that day's counter-items and quantities replace these; overrides and sold-out marks clear. */
  const applySource = useCallback(
    (source: CopySource) => {
      const from = new Map(source.items.map((item) => [item.menuItemId, item.quantity]))
      edit((current) => {
        const items = { ...current.items }
        for (const id of Object.keys(items)) {
          const quantity = from.get(id)
          items[id] =
            quantity === undefined
              ? { ...items[id], included: false, override: "", soldOut: false }
              : { included: true, quantity: Math.min(DAY_QUANTITY.max, quantity), override: "", soldOut: false }
        }
        return { ...current, items }
      })
      setExpanded(new Set())
    },
    [edit],
  )

  // ── Save / discard ────────────────────────────────────────────────────────

  const discard = useCallback(() => {
    setPlan(saved)
    setCloseConfirmed(false)
    setProblem(null)
  }, [saved])

  const save = useCallback(
    (confirmed = closeConfirmed) => {
      if (!canSave && !confirmed) return
      setProblem(null)
      const snapshot = plan
      startTransition(async () => {
        const result = await saveMenuDay({
          date: data.date,
          isOpen: snapshot.isOpen,
          cutoff: cutoffKey(snapshot.cutoff),
          maxOrders: snapshot.maxOrders,
          overbookLimit: snapshot.overbookLimit,
          publicNote: snapshot.publicNote.trim(),
          closureNote: snapshot.closureNote.trim(),
          items: Object.entries(snapshot.items)
            .filter(([, item]) => item.included)
            .map(([menuItemId, item]) => ({
              menuItemId,
              quantityAvailable: item.quantity,
              priceOverridePaise: overridePaise(item.override, basePrices[menuItemId] ?? 0) ?? null,
              soldOut: item.soldOut,
            })),
          confirmClose: confirmed,
        })
        if (result.ok) {
          setSaved(snapshot)
          setCloseConfirmed(false)
          setFlash(true)
          if (flashTimer.current) clearTimeout(flashTimer.current)
          flashTimer.current = setTimeout(() => setFlash(false), FLASH_MS)
          return
        }
        if (result.reason === "HAS_ORDERS") setClosing(result.orders)
        else if (result.reason === "UNAVAILABLE_ITEM") setProblem("unavailable")
        else setProblem("failed")
      })
    },
    [basePrices, canSave, closeConfirmed, data.date, plan],
  )

  /** The close confirm opened by the server (orders arrived after the page loaded): confirm and save in one go. */
  const confirmCloseAndSave = useCallback(() => {
    setClosing(null)
    setCloseConfirmed(true)
    save(true)
  }, [save])

  return {
    plan,
    saved,
    expanded,
    toggleExpanded,
    query,
    setQuery,
    category,
    setCategory,
    setOpen,
    setCutoff,
    setMaxOrders,
    setOverbook,
    setPublicNote,
    setClosureNote,
    toggleItem,
    setAll,
    setQuantity,
    setOverride,
    toggleSoldOut,
    applySource,
    changes,
    priceIssues,
    dirty,
    saveState,
    canSave,
    pending,
    problem,
    save,
    discard,
    closing,
    cancelClose: () => setClosing(null),
    /** The confirm came from the switch (nothing saved yet) or from a refused save. */
    confirmClose: saved.isOpen && !plan.isOpen ? confirmCloseAndSave : confirmClose,
  }
}

export type DayEditor = ReturnType<typeof useDayEditor>
