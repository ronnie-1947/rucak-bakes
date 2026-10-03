import type { DaySheetData } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import { pendingText, summaryText } from "./copy"
import { PrintBakeSection } from "./PrintBakeSection"
import { PrintNotes } from "./PrintNotes"
import { PrintPickups } from "./PrintPickups"
import type { DaySheetCopy } from "./types"

type PrintSheetProps = {
  data: DaySheetData
  dict: DaySheetCopy
  itemTemplate: string
}

/**
 * What Print puts on paper, in place of the screen: A4, black on white. Verified orders only, whatever the
 * screen's pending switch says — the printout is what gets baked. Notes first, then the bake list a category
 * at a time (no category split across pages), then the collections table. Hidden on screen.
 */
export function PrintSheet({ data, dict, itemTemplate }: PrintSheetProps) {
  const groups = data.bake.map((group) => ({ ...group, rows: group.rows.filter((row) => row.verified > 0) })).filter((group) => group.rows.length > 0)
  const notes = data.notes.filter((note) => !note.pending)
  const orders = data.orders.filter((order) => !order.pending)

  return (
    <div className="hidden flex-col gap-6 bg-background text-body text-print print:flex">
      <header className="flex items-end justify-between gap-4 border-b-2 border-print pb-3">
        <div className="flex flex-col">
          <span className="font-semibold">{data.bakeryName}</span>
          <span className="font-display text-glance-lg font-semibold">{data.title}</span>
        </div>
        <div className="flex flex-col items-end tabular-nums">
          <span className="font-semibold">{summaryText(data, dict)}</span>
          <span>{fill(dict.printAsOf, { time: data.asOf })}</span>
        </div>
      </header>

      {data.pendingCount > 0 ? <p>{fill(dict.printPendingLeftOut, { pending: pendingText(data.pendingCount, dict) })}</p> : null}

      {orders.length === 0 ? (
        <p>{dict.printNothing}</p>
      ) : (
        <>
          {notes.length > 0 ? <PrintNotes notes={notes} dict={dict} /> : null}
          <section className="flex flex-col gap-2">
            <h2 className="text-h1">{dict.bakeTitle}</h2>
            {groups.map((group) => (
              <PrintBakeSection key={group.name ?? ""} title={group.name ?? dict.uncategorised} rows={group.rows} dict={dict} />
            ))}
          </section>
          <PrintPickups orders={orders} dict={dict} itemTemplate={itemTemplate} />
        </>
      )}
    </div>
  )
}
