import type { BakeRow as BakeRowData } from "@/lib/daysheet/queries"
import { BakeRow } from "./BakeRow"
import type { DaySheetCopy } from "./types"

type BakeSectionProps = {
  /** The category, or dict.uncategorised. */
  title: string
  rows: BakeRowData[]
  showPending: boolean
  dict: DaySheetCopy
}

/** One category of the bake list — "BREADS", then its items, biggest total first. */
export function BakeSection({ title, rows, showPending, dict }: BakeSectionProps) {
  return (
    <section className="flex flex-col">
      <h3 className="border-b border-border pt-3 pb-1 font-sans text-micro font-semibold text-muted uppercase">{title}</h3>
      <ul>
        {rows.map((row) => (
          <BakeRow key={row.menuItemId} row={row} showPending={showPending} dict={dict} />
        ))}
      </ul>
    </section>
  )
}
