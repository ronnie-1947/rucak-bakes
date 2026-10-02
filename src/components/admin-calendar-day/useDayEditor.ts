"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { saveMenuDay } from "@/app/actions/calendar"
import { type CutoffChoice, cutoffKey } from "@/lib/calendar/cutoffs"
import type { CopySource, DayEditorData } from "@/lib/calendar/day"
import { changeCount, DAY_QUANTITY, type DayPlan, overridePaise, overrideProblems, quantityConflicts, withMaxOrders } from "@/lib/calendar/form"
import type { DayOrder } from "@/lib/calendar/week"

/** Why the last save didn't land. `refreshed`: orders came in meanwhile and the ordered counts moved. */
export type SaveProblem = "failed" | "refreshed" | "unavailable"

export type SaveState = "saved" | "conflicts" | "prices" | "unsaved" | "clean"

const FLASH_MS = 1800

/**
 * Everything the day editor holds: the plan being edited against the saved one, what's already ordered per
 * item, which rows are open, the search and category, and Save / Discard. A quantity below what's ordered is
 * a conflict that blocks Save with the reason named — never clamped. Closing a day with orders goes through
 * the confirm first; the save then tells the server it was confirmed.
 */
export function useDayEditor(data: DayEditorData) {
  const [plan, setPlan] = useState<DayPlan>(data.saved)
  const [saved, setSaved] = useState<DayPlan>(data.saved)
  const [ordered, setOrdered] = useState(data.ordered)
  const [seenOrdered, setSeenOrdered] = useState(data.ordered)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [closing, setClosing] = useState<DayOrder[] | null>(null)
  const [closeConfirmed, setCloseConfirmed] = useState(false)
  const [flash, setFlash] = useState(false)
  const [problem, setProblem] = useState<SaveProblem | null>(null)
  const [pending, startTransition] = useTransition()
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fresh counts from the server (after a save, or orders arriving and the page refreshing).
  if (data.ordered !== seenOrdered) {
    setSeenOrdered(data.ordered)
    setOrdered(data.ordered)
  }

  useEffect(() => {
    const timer = flashTimer
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const basePrices = useMemo(() => Object.fromEntries(data.items.map((item) => [item.id, item.basePricePaise])), [data.items])
  const changes = useMemo(() => changeCount(plan, saved, basePrices), [plan, saved, basePrices])
  const conflicts = useMemo(() => quantityConflicts(plan, ordered), [plan, ordered])
  const priceIssues = useMemo(() => overrideProblems(plan, basePrices), [plan, basePrices])
  const dirty = changes > 0

  const saveState: SaveState = flash ? "saved" : conflicts.length > 0 ? "conflicts" : priceIssues.length > 0 ? "prices" : dirty ? "unsaved" : "clean"
  const canSave = !data.isPast && !pending && dirty && conflicts.length === 0 && priceIssues.length === 0

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

  /** Ticking opens the row's controls; an item with orders can't be unticked (its checkbox is disabled). */
  const toggleItem = useCallback(
    (id: string) => {
      const included = !plan.items[id].included
      if (!included && (ordered[id] ?? 0) > 0) return
      editItem(id, { included })
      setExpanded((current) => {
        const next = new Set(current)
        if (included) next.add(id)
        else next.delete(id)
        return next
      })
    },
    [editItem, ordered, plan.items],
  )

  /** Select all / Clear all, over the rows the search and category leave visible. Ordered items stay ticked. */
  const setAll = useCallback(
    (ids: string[], included: boolean) => {
      edit((current) => {
        const items = { ...current.items }
        for (const id of ids) if (included || (ordered[id] ?? 0) === 0) items[id] = { ...items[id], included }
        return { ...current, items }
      })
      if (!included) setExpanded(new Set())
    },
    [edit, ordered],
  )

  const setQuantity = useCallback((id: string, quantity: number) => editItem(id, { quantity }), [editItem])
  /** Digits and one dot, as typed — checked as a price when saving. */
  const setOverride = useCallback((id: string, text: string) => editItem(id, { override: text.replace(/[^\d.]/g, "").slice(0, 9) }), [editItem])
  const soldOut = useCallback((id: string) => editItem(id, { quantity: ordered[id] ?? 0 }), [editItem, ordered])

  /**
   * "Copy from another day": that day's items and quantities replace these; overrides clear. An item with
   * orders stays on, with at least the amount ordered.
   */
  const applySource = useCallback(
    (source: CopySource) => {
      const from = new Map(source.items.map((item) => [item.menuItemId, item.quantity]))
      edit((current) => {
        const items = { ...current.items }
        for (const id of Object.keys(items)) {
          const done = ordered[id] ?? 0
          const quantity = from.get(id)
          if (quantity !== undefined) items[id] = { included: true, quantity: Math.min(DAY_QUANTITY.max, Math.max(quantity, done)), override: "" }
          else if (done > 0) items[id] = { ...items[id], included: true, quantity: Math.max(items[id].quantity, done), override: "" }
          else items[id] = { ...items[id], included: false, override: "" }
        }
        return { ...current, items }
      })
      setExpanded(new Set())
    },
    [edit, ordered],
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
        else if (result.reason === "BELOW_ORDERED") {
          setOrdered(result.ordered)
          setProblem("refreshed")
        } else if (result.reason === "UNAVAILABLE_ITEM") setProblem("unavailable")
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
    ordered,
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
    soldOut,
    applySource,
    changes,
    conflicts,
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
