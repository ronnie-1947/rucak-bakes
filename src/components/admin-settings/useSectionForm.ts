"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import type { SaveResult } from "@/app/actions/settings"
import { useSettingsLeave } from "@/hooks/useSettingsLeave"
import { formatTimeIn } from "@/lib/dates"
import type { Problems } from "@/lib/settings/form"

/** Why the last save didn't land: a dropped connection, a value the server refused, or not an owner. */
export type SaveProblem = "failed" | "invalid" | "forbidden"

type Options<T, F extends string> = {
  /** The section's values as last saved — fresh from the server after every save. */
  saved: T
  problems: (values: T) => Problems<F>
  changes: (current: T, saved: T) => number
  /** Trims what's typed before it's sent and becomes the new saved state. */
  tidy?: (values: T) => T
  submit: (values: T) => Promise<SaveResult>
  /** The bakery's — for "Saved · 11:02". */
  timezone: string
}

/**
 * One settings section that saves as a form (Bakery details, Ordering rules, Appearance): the values being
 * edited against the saved ones, what's wrong with them, Save and Discard. Problems show as soon as they
 * exist and hold Save back, with the bar saying how many. The change count also feeds the leave guard.
 */
export function useSectionForm<T extends object, F extends string>({
  saved,
  problems: rules,
  changes: count,
  tidy,
  submit,
  timezone,
}: Options<T, F>) {
  const [values, setValues] = useState(saved)
  const [base, setBase] = useState(saved)
  const [seen, setSeen] = useState(saved)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [problem, setProblem] = useState<SaveProblem | null>(null)
  const [pending, startTransition] = useTransition()

  const changes = count(values, base)

  // Fresh values from the server (after a save, or another owner's): the new baseline. Edits in progress stay.
  if (saved !== seen) {
    setSeen(saved)
    setBase(saved)
    if (changes === 0) setValues(saved)
  }

  const problems = rules(values)
  const problemCount = Object.keys(problems).length
  const dirty = changes > 0
  const canSave = dirty && problemCount === 0 && !pending

  const { report } = useSettingsLeave()
  useEffect(() => report(changes), [changes, report])
  useEffect(() => () => report(0), [report])

  const set = useCallback((patch: Partial<T>) => {
    setValues((current) => ({ ...current, ...patch }))
    setSavedAt(null)
    setProblem(null)
  }, [])

  const discard = useCallback(() => {
    setValues(base)
    setProblem(null)
  }, [base])

  const save = useCallback(() => {
    if (!canSave) return
    const snapshot = tidy ? tidy(values) : values
    setProblem(null)
    startTransition(async () => {
      try {
        const result = await submit(snapshot)
        if (result.ok) {
          setBase(snapshot)
          setValues(snapshot)
          setSavedAt(formatTimeIn(new Date(), timezone))
        } else setProblem(result.reason === "FORBIDDEN" ? "forbidden" : "invalid")
      } catch {
        setProblem("failed")
      }
    })
  }, [canSave, submit, tidy, timezone, values])

  return { values, saved: base, set, problems, problemCount, changes, dirty, canSave, pending, problem, savedAt, save, discard }
}

export type SectionForm<T, F extends string> = {
  values: T
  saved: T
  set: (patch: Partial<T>) => void
  problems: Problems<F>
  problemCount: number
  changes: number
  dirty: boolean
  canSave: boolean
  pending: boolean
  problem: SaveProblem | null
  savedAt: string | null
  save: () => void
  discard: () => void
}
