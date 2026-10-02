"use client"

import { Button } from "@/components/ui/Button"
import { fill } from "@/lib/template"
import type { MenuCopy } from "./types"

type BulkBarProps = {
  dict: MenuCopy
  selectedCount: number
  /** How many of the selection each action would change. */
  activatable: number
  deactivatable: number
  pending: boolean
  onActivate: () => void
  onDeactivate: () => void
  onArchive: () => void
}

/** Sticks to the bottom of the scroll area in select mode. Deactivate and Archive go through the usual confirms. */
export function BulkBar({ dict, selectedCount, activatable, deactivatable, pending, onActivate, onDeactivate, onArchive }: BulkBarProps) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 border-t border-border bg-background px-4 pt-3 pb-safe shadow-raised md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-22 flex-1 font-semibold tabular-nums">{fill(dict.selected, { count: selectedCount })}</span>
        <Button variant="outline" disabled={activatable === 0 || pending} onClick={onActivate}>
          {dict.activate}
        </Button>
        <Button variant="outline" disabled={deactivatable === 0 || pending} onClick={onDeactivate}>
          {dict.deactivate}
        </Button>
        <Button variant="dangerOutline" disabled={selectedCount === 0 || pending} onClick={onArchive}>
          {dict.archive}
        </Button>
      </div>
    </div>
  )
}
