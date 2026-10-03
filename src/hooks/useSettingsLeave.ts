"use client"

import { createContext, type MouseEvent, useContext } from "react"

export type SettingsLeaveApi = {
  /** The open section's unsaved changes — reported by its form, shown as the list's dot. */
  changes: number
  /** A section form reports its count on every change, and 0 as it unmounts. */
  report: (changes: number) => void
  /** For a link out of the section: with unsaved changes, it stops the navigation and asks first. */
  guard: (event: MouseEvent<HTMLAnchorElement>, href: string) => void
}

export const SettingsLeaveContext = createContext<SettingsLeaveApi | null>(null)

/** Inside a LeaveGuard (src/components/admin-settings/). */
export function useSettingsLeave(): SettingsLeaveApi {
  const api = useContext(SettingsLeaveContext)
  if (!api) throw new Error("useSettingsLeave must be used inside <LeaveGuard>")
  return api
}
