"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { checkDaySheet } from "@/app/actions/daysheet"
import { Button } from "@/components/ui/Button"
import { useDaySheet } from "@/hooks/useDaySheet"
import type { SheetVersion } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import type { DaySheetCopy } from "./types"

type SheetWatcherProps = {
  date: string
  version: SheetVersion
  /** Today or later — a past day doesn't change. */
  live: boolean
  dict: DaySheetCopy
}

const POLL_MS = 15_000

/** A `SheetVersion.orders` key is "id:p" or "id:v". */
const idOf = (key: string) => key.split(":")[0]
const sameKeys = (a: string[], b: string[]) => a.length === b.length && a.every((key, index) => key === b[index])

/**
 * Keeps the sheet in step with the other devices. Every 15 seconds while the page is visible it asks for the
 * day's version: a tick made elsewhere, or orders only leaving the day (cancelled, no-show), just refresh the sheet —
 * nothing should be baked for an order that's gone. A new or newly verified order shows this line instead, so the bake
 * list never grows under someone's finger, and marks the sheet stale, so a printout made from it anyway (Ctrl+P) says so.
 * The parent keys it on the orders it was rendered with, so a refresh that brings them in starts it afresh.
 */
export function SheetWatcher({ date, version, live, dict }: SheetWatcherProps) {
  const router = useRouter()
  const { markStale } = useDaySheet()
  const [changed, setChanged] = useState<{ added: number } | null>(null)
  const [refreshing, startTransition] = useTransition()

  useEffect(() => {
    if (!live) return
    let stopped = false
    const known = new Set(version.orders.map(idOf))

    async function poll() {
      if (document.visibilityState !== "visible") return
      const latest = await checkDaySheet(date).catch(() => null)
      if (stopped || !latest) return
      if (sameKeys(latest.orders, version.orders)) {
        if (latest.ticks !== version.ticks) router.refresh()
        return
      }
      // Both lists are sorted, so the orders still here, in order, equal `latest` exactly when nothing arrived or changed.
      const still = new Set(latest.orders.map(idOf))
      const remaining = version.orders.filter((key) => still.has(idOf(key)))
      if (sameKeys(remaining, latest.orders)) {
        router.refresh()
        return
      }
      setChanged({ added: latest.orders.filter((key) => !known.has(idOf(key))).length })
      markStale()
    }

    const timer = setInterval(poll, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [date, live, router, version, markStale])

  if (!changed) return null
  const text = changed.added === 1 ? dict.changedNewOne : changed.added > 1 ? fill(dict.changedNew, { count: changed.added }) : dict.changed

  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-panel border border-o200 bg-o50 py-2 pr-2 pl-4">
      <span className="min-w-40 flex-1 font-semibold">{text}</span>
      <Button
        variant="outlineLink"
        disabled={refreshing}
        onClick={() =>
          startTransition(() => {
            setChanged(null)
            router.refresh()
          })
        }
      >
        {dict.refresh}
      </Button>
    </div>
  )
}
