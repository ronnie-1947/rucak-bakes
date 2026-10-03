import type { BakeRow } from "@/lib/daysheet/queries"
import { unitText } from "./copy"
import type { DaySheetCopy } from "./types"

type PrintBakeSectionProps = {
  title: string
  /** Rows with a verified total — pending never prints. */
  rows: BakeRow[]
  dict: DaySheetCopy
}

/** One category on paper, never split across a page: 32px quantities (24pt), the item, a square to tick by pen. */
export function PrintBakeSection({ title, rows, dict }: PrintBakeSectionProps) {
  return (
    <section className="flex break-inside-avoid flex-col">
      <h3 className="border-b border-print pt-2 pb-1 font-sans text-small font-semibold uppercase">{title}</h3>
      <ul>
        {rows.map((row) => (
          <li key={row.menuItemId} className="grid min-h-14 grid-cols-[4.5rem_minmax(0,1fr)_2rem] items-center gap-4 border-b border-print/40 py-2">
            <span className="text-glance font-semibold tabular-nums">{row.verified}</span>
            <span className="flex flex-col">
              <span className="text-h2 font-semibold">
                {row.name}
                {row.noted ? ` ${dict.seeNote}` : null}
              </span>
              {unitText(row, dict) ? <span className="text-small">{unitText(row, dict)}</span> : null}
            </span>
            <span aria-hidden className="size-7 border-2 border-print" />
          </li>
        ))}
      </ul>
    </section>
  )
}
