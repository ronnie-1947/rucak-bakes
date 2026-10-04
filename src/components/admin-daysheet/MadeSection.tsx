import type { MadeRow as MadeRowData } from "@/lib/daysheet/queries"
import { MadeRow } from "./MadeRow"
import type { DaySheetCopy } from "./types"

type MadeSectionProps = {
  rows: MadeRowData[]
  dict: DaySheetCopy
}

/** "MADE TO ORDER" — after the categories: one row per line of an item that bakes separately, in pickup order. */
export function MadeSection({ rows, dict }: MadeSectionProps) {
  return (
    <section className="flex flex-col">
      <h3 className="border-b border-border pt-3 pb-1 font-sans text-micro font-semibold text-muted uppercase">{dict.madeTitle}</h3>
      <ul>
        {rows.map((row) => (
          <MadeRow key={row.lineId} row={row} dict={dict} />
        ))}
      </ul>
    </section>
  )
}
