"use client"

import { useDaySheet } from "@/hooks/useDaySheet"
import type { CounterRow as CounterRowData } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import { unitText } from "./copy"
import { DoneBox } from "./DoneBox"
import { SheetRow } from "./SheetRow"
import type { DaySheetCopy } from "./types"

type CounterRowProps = {
  row: CounterRowData
  dict: DaySheetCopy
}

/** One counter-item: the quantity made (planned in the Calendar), what it is, and the Baked tick. */
export function CounterRow({ row, dict }: CounterRowProps) {
  const { isDone, toggle, readOnly } = useDaySheet()
  const done = isDone("counter", row.tickId)
  const sub = unitText(row, dict)

  return (
    <SheetRow
      done={done}
      quantity={row.quantity}
      tick={
        <DoneBox
          done={done}
          onToggle={() => toggle({ kind: "counter", id: row.tickId, label: row.name })}
          label={fill(dict.markBaked, { name: row.name })}
          disabled={readOnly}
        />
      }
    >
      <span className="text-h2 font-semibold wrap-break-word">{row.name}</span>
      {sub ? <span className="text-small text-muted">{sub}</span> : null}
      {done ? <span className="text-small font-semibold text-green">{dict.done}</span> : null}
    </SheetRow>
  )
}
