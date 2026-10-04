"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { findCustomerByPhone } from "@/app/actions/customers"
import { createStaffOrder } from "@/app/actions/orders"
import { MAX_LINE_QTY } from "@/lib/cart/cart"
import type { CustomerLookup } from "@/lib/customers/lookup"
import type { IsoDate } from "@/lib/dates"
import type { NewOrderItem, NewOrderPage } from "@/lib/orders/new-order"
import { missingStep, staffOrderWarnings, staffRoom, typedPhone } from "@/lib/orders/staff-order"
import { normalise } from "@/lib/phone"
import { cleanRupees, parseRupees, rupees } from "./draft"
import type { DraftLine, FormLine, FullCounts, LookupState, Mode, Refusal } from "./types"

const ORDERS = "/admin/orders"

/** Ten digits that make a real number — the moment to look the customer up. */
function fullNumber(phone: string): boolean {
  return phone.replace(/\D/g, "").length === 10 && normalise(phone) !== null
}

/**
 * Everything the new-order form holds (7R.5): the customer and their lookup, the lines, when, the notes, and Add order —
 * with the full-day confirm, the refusals and the leave guard. One idempotency key per form, kept across retries and the
 * confirm; a saved order leaves the page, so the next form starts with a new one.
 */
export function useNewOrder(page: NewOrderPage) {
  const router = useRouter()
  const start = page.customer
  const [phone, setPhone] = useState(start?.phone ?? "")
  const [name, setNameValue] = useState(start?.name ?? "")
  const [lookup, setLookup] = useState<{ state: LookupState; customer: CustomerLookup | null }>(
    start ? { state: "found", customer: start } : { state: "idle", customer: null },
  )
  const [lines, setLines] = useState<DraftLine[]>([])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [mode, setModeValue] = useState<Mode>("PICKUP")
  const [date, setDateValue] = useState<IsoDate | null>(page.date)
  const [time, setTime] = useState("")
  const [address, setAddress] = useState(start?.address ?? "")
  const [fee, setFeeValue] = useState(rupees(page.deliveryFeePaise))
  const [note, setNote] = useState("")
  const [internalNote, setInternalNote] = useState("")
  const [dialog, setDialog] = useState<"full" | "leave" | null>(null)
  const [leaveTo, setLeaveTo] = useState(ORDERS)
  const [serverCounts, setServerCounts] = useState<FullCounts | null>(null)
  const [refusal, setRefusal] = useState<Refusal | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [idempotencyKey] = useState(() => crypto.randomUUID())

  /** The number the latest lookup is for — an answer for any other number arrived too late. */
  const asked = useRef(start?.phone ?? "")
  /** Staff typed a name — a lookup no longer replaces it. */
  const nameTyped = useRef(false)

  const itemsById = useMemo(() => new Map(page.items.map((item) => [item.id, item])), [page.items])
  const day = page.window.days.find((candidate) => candidate.date === date) ?? null
  const delivery = mode === "DELIVERY"

  // ── Derived ───────────────────────────────────────────────────────────────

  const formLines: FormLine[] = useMemo(
    () =>
      lines.map((line) => {
        const unitPricePaise = parseRupees(line.price) ?? line.menuPricePaise
        return {
          ...line,
          unitPricePaise,
          custom: unitPricePaise !== line.menuPricePaise,
          totalPaise: unitPricePaise * line.quantity,
          gone: !itemsById.has(line.id),
        }
      }),
    [lines, itemsById],
  )
  const feePaise = delivery ? (parseRupees(fee) ?? 0) : 0
  const subtotalPaise = formLines.reduce((sum, line) => sum + line.totalPaise, 0)
  const totalPaise = subtotalPaise + feePaise
  const itemCount = formLines.reduce((sum, line) => sum + line.quantity, 0)

  const warnings = useMemo(
    () =>
      staffOrderWarnings(
        formLines.map((line) => ({
          name: line.name,
          noticeDays: line.noticeDays,
          quantity: line.quantity,
          unitPricePaise: line.unitPricePaise,
          menuPricePaise: line.menuPricePaise,
        })),
        day,
        page.window,
      ),
    [formLines, day, page.window],
  )

  const phoneValid = normalise(phone) !== null
  const missing = missingStep({ phone, name, lineCount: lines.length, day, delivery, address })
  const full = day !== null && day.isOpen && staffRoom(day) <= 0
  const fullCounts: FullCounts | null = serverCounts ?? (day ? { count: day.taken, verified: day.verified, max: day.maxOrders } : null)

  const dirty =
    lines.length > 0 ||
    note.trim() !== "" ||
    internalNote.trim() !== "" ||
    phone !== (start?.phone ?? "") ||
    name.trim() !== (start?.name ?? "") ||
    address.trim() !== (start?.address ?? "")

  // Work in progress survives an accidental tab close or reload as the browser's prompt.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  // ── Customer ──────────────────────────────────────────────────────────────

  const changePhone = useCallback((raw: string) => {
    const next = typedPhone(raw)
    setPhone(next)
    setRefusal(null)
    if (next === asked.current) return
    if (!fullNumber(next)) {
      asked.current = ""
      setLookup({ state: "idle", customer: null })
      return
    }
    asked.current = next
    setLookup({ state: "looking", customer: null })
    findCustomerByPhone(next).then(
      (found) => {
        if (asked.current !== next) return
        setLookup({ state: found ? "found" : "new", customer: found })
        if (!found) return
        setNameValue((current) => (nameTyped.current && current.trim() ? current : found.name))
        if (found.address) setAddress((current) => (current.trim() ? current : (found.address ?? "")))
      },
      () => {
        if (asked.current === next) setLookup({ state: "failed", customer: null })
      },
    )
  }, [])

  const changeName = useCallback((value: string) => {
    nameTyped.current = true
    setNameValue(value)
    setRefusal(null)
  }, [])

  // ── Lines ─────────────────────────────────────────────────────────────────

  const addItem = useCallback((item: NewOrderItem) => {
    setRefusal(null)
    setLines((current) =>
      current.some((line) => line.id === item.id)
        ? current
        : [
            ...current,
            {
              id: item.id,
              name: item.name,
              unit: item.unit,
              menuPricePaise: item.pricePaise,
              noticeDays: item.noticeDays,
              quantity: 1,
              price: rupees(item.pricePaise),
            },
          ],
    )
  }, [])

  const patchLine = useCallback((id: string, patch: Partial<DraftLine>) => {
    setRefusal(null)
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }, [])

  const setQuantity = useCallback((id: string, quantity: number) => patchLine(id, { quantity: Math.min(MAX_LINE_QTY, Math.max(1, quantity)) }), [patchLine])
  const setPrice = useCallback((id: string, text: string) => patchLine(id, { price: cleanRupees(text) }), [patchLine])
  const resetPrice = useCallback(
    (id: string) => setLines((current) => current.map((line) => (line.id === id ? { ...line, price: rupees(line.menuPricePaise) } : line))),
    [],
  )
  const removeLine = useCallback((id: string) => {
    setRefusal(null)
    setLines((current) => current.filter((line) => line.id !== id))
  }, [])

  // ── When ──────────────────────────────────────────────────────────────────

  const setDate = useCallback(
    (next: IsoDate) => {
      setDateValue(next)
      setServerCounts(null)
      setRefusal(null)
      // A time the new day's hours don't offer goes back to any time.
      setTime((current) => (current && !(page.slots[next] ?? []).includes(current) ? "" : current))
    },
    [page.slots],
  )

  const setMode = useCallback((next: Mode) => {
    setModeValue(next)
    setRefusal(null)
  }, [])

  const setFee = useCallback((text: string) => setFeeValue(cleanRupees(text)), [])

  // ── Leaving ───────────────────────────────────────────────────────────────

  /** Navigates, or — with something entered — asks first. Returns true when it asked (the caller cancels its own navigation). */
  const guard = useCallback(
    (href: string): boolean => {
      if (!dirty) return false
      setLeaveTo(href)
      setDialog("leave")
      return true
    },
    [dirty],
  )

  const back = useCallback(() => {
    if (!guard(ORDERS)) router.push(ORDERS)
  }, [guard, router])

  const leave = useCallback(() => {
    setDialog(null)
    router.push(leaveTo)
  }, [leaveTo, router])

  // ── Add order ─────────────────────────────────────────────────────────────

  const submit = useCallback(
    (allowFull: boolean) => {
      if (missing || pending || !date) return
      if (full && !allowFull) {
        setSheetOpen(false)
        setDialog("full")
        return
      }
      setRefusal(null)
      startTransition(async () => {
        let result: Awaited<ReturnType<typeof createStaffOrder>>
        try {
          result = await createStaffOrder({
            idempotencyKey,
            fulfilmentDate: date,
            fulfilmentType: mode,
            name,
            phone,
            address: delivery ? address : null,
            pickupTime: !delivery && time ? time : null,
            note: note.trim() || null,
            internalNote: internalNote.trim() || null,
            deliveryFeePaise: feePaise,
            allowFull,
            items: formLines.map((line) => ({ menuItemId: line.id, quantity: line.quantity, unitPricePaise: line.custom ? line.unitPricePaise : null })),
          })
        } catch {
          setDialog(null)
          setRefusal({ kind: "network" })
          return
        }
        if (result.ok) {
          router.replace(`/admin/orders/${result.id}?added=1`)
          return
        }
        setSheetOpen(false)
        if (result.reason === "DAY_FULL") {
          setServerCounts({ count: result.liveCount, verified: result.verifiedCount, max: result.maxOrders })
          setDialog("full")
          return
        }
        setDialog(null)
        switch (result.reason) {
          case "DAY_CLOSED":
          case "PAST_DATE":
            setRefusal({ kind: result.reason === "DAY_CLOSED" ? "closed" : "past", date: result.date })
            router.refresh()
            break
          case "ITEM_UNAVAILABLE":
            setRefusal({ kind: "item", name: result.name })
            router.refresh()
            break
          case "INVALID":
            setRefusal({ kind: "invalid", field: result.field })
        }
      })
    },
    [address, date, delivery, feePaise, formLines, full, idempotencyKey, internalNote, missing, mode, name, note, pending, phone, router, time],
  )

  return {
    page,
    phone,
    phoneValid,
    changePhone,
    name,
    changeName,
    lookup,
    lines: formLines,
    addItem,
    setQuantity,
    setPrice,
    resetPrice,
    removeLine,
    query,
    setQuery,
    category,
    setCategory,
    mode,
    setMode,
    date,
    setDate,
    day,
    time,
    setTime,
    address,
    setAddress,
    fee,
    setFee,
    feePaise,
    note,
    setNote,
    internalNote,
    setInternalNote,
    delivery,
    itemCount,
    totalPaise,
    warnings,
    missing,
    fullCounts,
    dialog,
    setDialog,
    sheetOpen,
    setSheetOpen,
    refusal,
    pending,
    submit,
    guard,
    back,
    leave,
  }
}

export type NewOrderForm = ReturnType<typeof useNewOrder>
