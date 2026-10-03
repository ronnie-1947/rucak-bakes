"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import type { SaveResult } from "@/app/actions/settings"

export type LiveMarkState = "saved" | "failed" | null

const MARK_MS = 3000

/**
 * A switch that saves the moment it's flipped (Auto-verify, Pause ordering). `optimistic` runs inside the
 * transition, so a useOptimistic value shows at once and falls back to the server's if the save fails.
 * Afterwards: "✓ Saved" for 3 seconds, or a failure line that stays until the next try.
 */
export function useLiveSave() {
  const [pending, startTransition] = useTransition()
  const [mark, setMark] = useState<LiveMarkState>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const current = timer
    return () => {
      if (current.current) clearTimeout(current.current)
    }
  }, [])

  const run = useCallback((action: () => Promise<SaveResult>, optimistic: () => void) => {
    setMark(null)
    startTransition(async () => {
      optimistic()
      let ok = false
      try {
        ok = (await action()).ok
      } catch {
        ok = false
      }
      setMark(ok ? "saved" : "failed")
      if (timer.current) clearTimeout(timer.current)
      if (ok) timer.current = setTimeout(() => setMark(null), MARK_MS)
    })
  }, [])

  return { pending, mark, run }
}
