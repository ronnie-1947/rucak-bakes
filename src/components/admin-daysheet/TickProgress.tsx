"use client"

import { Meter } from "@/components/ui/Meter"
import { Notice } from "@/components/ui/Notice"
import { UndoBar } from "@/components/ui/UndoBar"
import { useDaySheet } from "@/hooks/useDaySheet"
import type { TickKind } from "@/lib/daysheet/tick"
import { fill } from "@/lib/template"
import type { DaySheetCopy } from "./types"

type TickProgressProps = {
  /** The tickable rows this list shows — For orders mixes item rows and Made to order lines. */
  rows: { kind: TickKind; id: string }[]
  /** "{done} of {total} done" */
  template: string
  meterLabel: string
  /** "Synced across devices" beside the count. */
  synced?: boolean
  dict: DaySheetCopy
}

/** "4 of 9 done", its bar, and — after a tap in this list — the green undo line or what went wrong. */
export function TickProgress({ rows, template, meterLabel, synced = true, dict }: TickProgressProps) {
  const { isDone, status } = useDaySheet()
  const done = rows.filter((row) => isDone(row.kind, row.id)).length
  const here = (kind: TickKind | undefined) => rows.some((row) => row.kind === kind)
  const failed = here(status.failed?.kind) ? status.failed : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold tabular-nums">{fill(template, { done, total: rows.length })}</span>
        {synced ? <span className="text-small text-muted">{dict.synced}</span> : null}
      </div>
      <Meter value={done} max={rows.length} label={meterLabel} />
      {failed ? <Notice tone="error">{failed.past ? dict.failedPast : dict.failed}</Notice> : null}
      {here(status.undo?.kind) && status.undo ? (
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
