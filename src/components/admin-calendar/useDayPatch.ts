"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { updateDay } from "@/app/actions/calendar"
import { type CutoffChoice, cutoffKey } from "@/lib/calendar/cutoffs"
import type { DayOrder, WeekDay } from "@/lib/calendar/week"

type Values = { isOpen: boolean; cutoff: CutoffChoice; maxOrders: number }

/** A stepper pause before Max orders is sent — tapping + five times saves once. */
const MAX_DEBOUNCE_MS = 500

function valuesOf(day: WeekDay): Values {
  return { isOpen: day.isOpen, cutoff: day.cutoff, maxOrders: day.maxOrders }
}

function signature(day: WeekDay): string {
  return `${day.isOpen}|${cutoffKey(day.cutoff)}|${day.maxOrders}`
}

/**
 * A week card's live controls. Each change shows at once and saves straight away (the stepper after a short
 * pause); a failure puts the card back and says so. Closing a day with orders asks first — and if orders
 * arrived since the page loaded, the server's refusal opens the same confirm with the fresh list.
 */
export function useDayPatch(day: WeekDay) {
  const [values, setValues] = useState<Values>(() => valuesOf(day))
  const [seen, setSeen] = useState(() => signature(day))
  const [closing, setClosing] = useState<DayOrder[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The server's copy changed (a save landed, or another screen changed the day): show it.
  if (signature(day) !== seen) {
    setSeen(signature(day))
    setValues(valuesOf(day))
  }

  // A max still waiting when the card goes away (the owner moved to another week) is sent now, not lost.
  const unsentMax = useRef<number | null>(null)
  useEffect(() => {
    const pendingTimer = timer
    const unsent = unsentMax
    const date = day.date
    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current)
      if (unsent.current !== null) void updateDay({ date, maxOrders: unsent.current })
    }
  }, [day.date])

  const send = useCallback(
    (patch: Partial<Values>, confirmClose = false) => {
      setFailed(false)
      startTransition(async () => {
        const result = await updateDay({
          date: day.date,
          isOpen: patch.isOpen,
          cutoff: patch.cutoff ? cutoffKey(patch.cutoff) : undefined,
          maxOrders: patch.maxOrders,
          confirmClose,
        })
        if (result.ok) {
          setClosing(null)
          return
        }
        setValues(valuesOf(day))
        if (result.reason === "HAS_ORDERS") setClosing(result.orders)
        else setFailed(true)
      })
    },
    [day],
  )

  const setOpen = useCallback(
    (isOpen: boolean) => {
      if (!isOpen && day.liveOrders.length > 0) {
        setClosing(day.liveOrders)
        return
      }
      setValues((current) => ({ ...current, isOpen }))
      send({ isOpen })
    },
    [day.liveOrders, send],
  )

  const confirmClose = useCallback(() => {
    setValues((current) => ({ ...current, isOpen: false }))
    send({ isOpen: false }, true)
  }, [send])

  const setCutoff = useCallback(
    (cutoff: CutoffChoice) => {
      setValues((current) => ({ ...current, cutoff }))
      send({ cutoff })
    },
    [send],
  )

  const setMaxOrders = useCallback(
    (maxOrders: number) => {
      setValues((current) => ({ ...current, maxOrders }))
      unsentMax.current = maxOrders
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        unsentMax.current = null
        send({ maxOrders })
      }, MAX_DEBOUNCE_MS)
    },
    [send],
  )

  return { values, setOpen, setCutoff, setMaxOrders, closing, cancelClose: () => setClosing(null), confirmClose, failed, pending }
}
