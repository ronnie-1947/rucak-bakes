"use client"

import { Icon } from "@/components/ui/icons/Icon"
import { useDaySheet } from "@/hooks/useDaySheet"
import type { BakeRow as BakeRowData } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import { unitText } from "./copy"
import { DoneBox } from "./DoneBox"
import { SheetRow } from "./SheetRow"
import type { DaySheetCopy } from "./types"

type BakeRowProps = {
  row: BakeRowData
  /** "Include pending" is on — the pending units show under the total, never in it, and pending orders join the who line. */
  showPending: boolean
  dict: DaySheetCopy
}

/**
 * One item across the day's orders: the total (the largest thing on the page), what it is, who it's for ("Meera BK-4821 ·
 * Anita BK-4815") and the tick — every verified line of it baked. A pending-only row has nothing to tick.
 */
export function BakeRow({ row, showPending, dict }: BakeRowProps) {
  const { isDone, toggle, readOnly } = useDaySheet()
  const tickable = row.verified > 0
  const done = tickable && isDone("item", row.menuItemId)
  const noted = row.noted || (showPending && row.pendingNoted)
  const sub = unitText(row, dict)
  const who = row.who
    .filter((order) => showPending || !order.pending)
    .map((order) => fill(dict.who, { name: order.name, code: order.code }))
    .join(" · ")

  return (
    <SheetRow
      done={done}
      quantity={row.verified}
      below={showPending && row.pending > 0 ? <span className="text-small text-muted">{fill(dict.plusPending, { count: row.pending })}</span> : null}
      tick={
        tickable ? (
          <DoneBox
            done={done}
            onToggle={() => toggle({ kind: "item", id: row.menuItemId, label: row.name })}
            label={fill(dict.markDone, { name: row.name })}
            disabled={readOnly}
          />
        ) : null
      }
    >
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
      {who ? <span className="text-small text-pretty text-muted tabular-nums">{who}</span> : null}
      {done ? <span className="text-small font-semibold text-green">{dict.done}</span> : null}
    </SheetRow>
  )
}
