"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { checkDaySheet } from "@/app/actions/daysheet"
import { Button } from "@/components/ui/Button"
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

/**
 * Keeps the sheet in step with the other devices. Every 15 seconds while the page is visible it asks for the
 * day's version: a tick made elsewhere just refreshes the sheet; a new, newly verified or dropped order
 * shows this line instead, so the bake list never reshuffles under someone's finger. The parent keys it on
 * the orders it was rendered with, so a refresh that brings them in starts it afresh.
 */
export function SheetWatcher({ date, version, live, dict }: SheetWatcherProps) {
  const router = useRouter()
  const [changed, setChanged] = useState<{ added: number } | null>(null)
  const [refreshing, startTransition] = useTransition()

  useEffect(() => {
    if (!live) return
    let stopped = false
    const known = new Set(version.orders.map((key) => key.split(":")[0]))
    const sameOrders = (keys: string[]) => keys.length === version.orders.length && keys.every((key, index) => key === version.orders[index])

    async function poll() {
      if (document.visibilityState !== "visible") return
      const latest = await checkDaySheet(date).catch(() => null)
      if (stopped || !latest) return
      if (!sameOrders(latest.orders)) setChanged({ added: latest.orders.filter((key) => !known.has(key.split(":")[0])).length })
      else if (latest.ticks !== version.ticks) router.refresh()
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
  }, [date, live, router, version])

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
