"use client"

import { useSettingsLeave } from "@/hooks/useSettingsLeave"

type DirtyDotProps = {
  label: string
}

/** The warm dot beside the open section's name while it has unsaved changes. */
export function DirtyDot({ label }: DirtyDotProps) {
  const { changes } = useSettingsLeave()
  if (changes === 0) return null
  return (
    <>
      <span aria-hidden className="size-2 shrink-0 rounded-pill bg-o500" />
      <span className="sr-only">{label}</span>
    </>
  )
}
