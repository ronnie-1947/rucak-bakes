"use client"

import { Button } from "@/components/ui/Button"
import { fill } from "@/lib/template"
import type { OrdersCopy } from "./types"

type BulkBarProps = {
  dict: OrdersCopy
  selectedCount: number
  /** How many of the selection can be verified (pending) and cancelled (pending or verified). */
  verifiable: number
  cancellable: number
  pending: boolean
  onVerify: () => void
  onCancel: () => void
}

/** Sticks to the bottom of the scroll area while in select mode. Both actions go through the usual dialogs. */
export function BulkBar({ dict, selectedCount, verifiable, cancellable, pending, onVerify, onCancel }: BulkBarProps) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background px-4 pt-3 pb-safe shadow-raised md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-2">
        <span className="flex-1 font-semibold">{fill(dict.selected, { count: selectedCount })}</span>
        <Button variant="dangerOutline" disabled={cancellable === 0 || pending} onClick={onCancel}>
          {dict.cancelAll}
        </Button>
        <Button variant="primary" disabled={verifiable === 0 || pending} onClick={onVerify}>
          {dict.verifyAll}
        </Button>
      </div>
    </div>
  )
}
