"use client"

import { useRouter } from "next/navigation"
import { type MouseEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { SettingsLeaveContext } from "@/hooks/useSettingsLeave"
import { LeaveDialog } from "./LeaveDialog"
import type { SettingsCopy } from "./types"

type LeaveGuardProps = {
  /** The open section's name, for "2 changes to Bakery details will be lost." */
  sectionTitle: string
  dict: SettingsCopy["leave"]
  children: ReactNode
}

/**
 * Holds the open section's unsaved-change count. Links out of the section (another section, Back) ask
 * first while it's above zero; a tab close or reload gets the browser's own prompt.
 */
export function LeaveGuard({ sectionTitle, dict, children }: LeaveGuardProps) {
  const router = useRouter()
  const [changes, setChanges] = useState(0)
  const [leaving, setLeaving] = useState<string | null>(null)

  const guard = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (changes === 0) return
      event.preventDefault()
      setLeaving(href)
    },
    [changes],
  )
  const api = useMemo(() => ({ changes, report: setChanges, guard }), [changes, guard])

  useEffect(() => {
    if (changes === 0) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [changes])

  return (
    <SettingsLeaveContext value={api}>
      {children}
      {leaving ? (
        <LeaveDialog
          section={sectionTitle}
          changes={changes}
          dict={dict}
          onClose={() => setLeaving(null)}
          onLeave={() => {
            setLeaving(null)
            router.push(leaving)
          }}
        />
      ) : null}
    </SettingsLeaveContext>
  )
}
