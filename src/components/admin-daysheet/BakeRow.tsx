"use client"

import { Icon } from "@/components/ui/icons/Icon"
import { useDaySheet } from "@/hooks/useDaySheet"
import type { BakeRow as BakeRowData } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import { unitText } from "./copy"
import { DoneBox } from "./DoneBox"
import type { DaySheetCopy } from "./types"

type BakeRowProps = {
  row: BakeRowData
  /** "Include pending" is on — the pending units show under the total, never in it. */
  showPending: boolean
  dict: DaySheetCopy
}

type State = "done" | "open"

const rows: Record<State, string> = {
  done: "bg-green-soft",
  open: "bg-background",
}

const quantities: Record<State, string> = {
  done: "text-green line-through",
  open: "text-foreground",
}

/** One item: the bake total (the largest thing on the page), what it is, and the Baked tick. */
export function BakeRow({ row, showPending, dict }: BakeRowProps) {
  const { isDone, toggle, readOnly } = useDaySheet()
  const state: State = row.tickId && isDone("bake", row.tickId) ? "done" : "open"
  const noted = row.noted || (showPending && row.pendingNoted)
  const sub = unitText(row, dict)
  const tickId = row.tickId

  return (
    <li
      className={`grid min-h-18 grid-cols-[4.5rem_minmax(0,1fr)_2.75rem] items-center gap-3 border-b border-border px-2 py-3 md:grid-cols-[5.5rem_minmax(0,1fr)_2.75rem] ${rows[state]}`}
    >
      <span className="flex flex-col items-start tabular-nums">
        <span className={`text-glance font-semibold md:text-glance-lg ${quantities[state]}`}>{row.verified}</span>
        {showPending && row.pending > 0 ? <span className="text-small text-muted">{fill(dict.plusPending, { count: row.pending })}</span> : null}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2 text-h2 font-semibold">
          <span className="min-w-0 wrap-break-word">{row.name}</span>
          {noted ? (
            <span title={dict.hasNote} className="shrink-0 text-o700">
              <Icon name="note" className="size-5" />
              <span className="sr-only">{dict.hasNote}</span>
            </span>
          ) : null}
        </span>
        {sub ? <span className="text-small text-muted">{sub}</span> : null}
        {state === "done" ? <span className="text-small font-semibold text-green">{dict.done}</span> : null}
      </span>
      {tickId ? (
        <DoneBox
          done={state === "done"}
          onToggle={() => toggle({ kind: "bake", id: tickId, label: row.name })}
          label={fill(dict.markDone, { name: row.name })}
          disabled={readOnly}
        />
      ) : (
        <span />
      )}
    </li>
  )
}
