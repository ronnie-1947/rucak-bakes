"use client"

import { Tag } from "@/components/ui/Tag"
import { useDaySheet } from "@/hooks/useDaySheet"
import type { MadeRow as MadeRowData } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import { DoneBox } from "./DoneBox"
import { SheetRow } from "./SheetRow"
import type { DaySheetCopy } from "./types"

type MadeRowProps = {
  row: MadeRowData
  dict: DaySheetCopy
}

/**
 * One line of an item that bakes separately — a cake for one customer: its quantity and name as ordered, the size note,
 * "For Sunita Reddy · BK-4827", and the customer's note right there (red when it names an allergen). A pending order's
 * line is shown, tagged, and can't be ticked.
 */
export function MadeRow({ row, dict }: MadeRowProps) {
  const { isDone, toggle, readOnly } = useDaySheet()
  const done = !row.pending && isDone("line", row.lineId)
  const sub = [fill(dict.madeFor, { name: row.customer, code: row.code }), row.sizeNote].filter(Boolean).join(" · ")

  return (
    <SheetRow
      done={done}
      quantity={row.quantity}
      tick={
        row.pending ? null : (
          <DoneBox
            done={done}
            onToggle={() => toggle({ kind: "line", id: row.lineId, label: row.name })}
            label={fill(dict.markDone, { name: row.name })}
            disabled={readOnly}
          />
        )
      }
    >
      <span className="text-h2 font-semibold wrap-break-word">{row.name}</span>
      <span className="text-small text-pretty text-muted tabular-nums">{sub}</span>
      {row.note || row.pending ? (
        <span className="flex flex-wrap items-center gap-2 pt-1">
          {row.note ? (
            <Tag tone={row.allergen ? "red" : "warm"} size="md" className="font-semibold">
              {row.note}
            </Tag>
          ) : null}
          {row.pending ? <Tag tone="warm">{dict.tags.pending}</Tag> : null}
        </span>
      ) : null}
      {done ? <span className="text-small font-semibold text-green">{dict.done}</span> : null}
    </SheetRow>
  )
}
