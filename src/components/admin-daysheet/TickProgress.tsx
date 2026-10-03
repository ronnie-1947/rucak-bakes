"use client"

import { Meter } from "@/components/ui/Meter"
import { Notice } from "@/components/ui/Notice"
import { UndoBar } from "@/components/ui/UndoBar"
import { useDaySheet } from "@/hooks/useDaySheet"
import type { TickKind } from "@/lib/daysheet/tick"
import { fill } from "@/lib/template"
import type { DaySheetCopy } from "./types"

type TickProgressProps = {
  kind: TickKind
  /** The tickable rows this list shows. */
  ids: string[]
  /** "{done} of {total} batches done" — already the singular or plural for `ids.length`. */
  template: string
  meterLabel: string
  dict: DaySheetCopy
}

/** "4 of 9 batches done", its bar, and — after a tap in this list — the green undo line or what went wrong. */
export function TickProgress({ kind, ids, template, meterLabel, dict }: TickProgressProps) {
  const { isDone, status } = useDaySheet()
  const done = ids.filter((id) => isDone(kind, id)).length
  const failed = status.failed?.kind === kind ? status.failed : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold tabular-nums">{fill(template, { done, total: ids.length })}</span>
        <span className="text-small text-muted">{dict.synced}</span>
      </div>
      <Meter value={done} max={ids.length} label={meterLabel} />
      {failed ? <Notice tone="error">{failed.past ? dict.failedPast : dict.failed}</Notice> : null}
      {status.undo?.kind === kind ? (
        <UndoBar
          text={status.undo.text}
          undo={{ label: dict.undo, onUndo: status.revert, pending: status.pending }}
          dismissLabel={dict.dismiss}
          onDismiss={status.dismiss}
        />
      ) : null}
    </div>
  )
}
