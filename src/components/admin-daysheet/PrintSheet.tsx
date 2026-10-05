import type { DaySheetData } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import { pendingText, summaryText, unitText } from "./copy"
import { PrintGroup, type PrintLine } from "./PrintGroup"
import { PrintNotes } from "./PrintNotes"
import { PrintPageRules } from "./PrintPageRules"
import { PrintPickups } from "./PrintPickups"
import { PrintStale } from "./PrintStale"
import type { DaySheetCopy } from "./types"

type PrintSheetProps = {
  data: DaySheetData
  dict: DaySheetCopy
  itemTemplate: string
}

/**
 * What Print puts on paper, in place of the screen: A4, black on white. Verified orders only, whatever the screen's
 * pending switch says — the printout is what gets baked. Print refreshes first when the orders changed (PrintButton); a
 * Ctrl+P on a sheet SheetWatcher found stale leads with a warning (PrintStale). The header (summary without times, when it was printed), notes,
 * For orders a category at a time with who each item is for, Made to order with its notes in bold, the counter-items,
 * then the collections table. No group or row splits across pages; later pages say "continued" and every page its
 * number. Hidden on screen.
 */
export function PrintSheet({ data, dict, itemTemplate }: PrintSheetProps) {
  const groups = data.bake
    .map((group) => ({
      title: group.name ?? dict.uncategorised,
      lines: group.rows
        .filter((row) => row.verified > 0)
        .map(
          (row): PrintLine => ({
            key: row.menuItemId,
            quantity: row.verified,
            name: row.name,
            mark: row.noted ? ` ${dict.seeNote}` : undefined,
            sub: unitText(row, dict) || undefined,
            who:
              row.who
                .filter((order) => !order.pending)
                .map((order) => fill(dict.who, { name: order.name, code: order.code }))
                .join(" · ") || undefined,
          }),
        ),
    }))
    .filter((group) => group.lines.length > 0)
  const made = data.made
    .filter((row) => !row.pending)
    .map(
      (row): PrintLine => ({
        key: row.lineId,
        quantity: row.quantity,
        name: row.name,
        sub: [fill(dict.madeFor, { name: row.customer, code: row.code }), row.sizeNote].filter(Boolean).join(" · "),
        note: row.note ? `${row.allergen ? `${dict.printAllergen.toUpperCase()} ` : ""}${row.note}` : undefined,
      }),
    )
  const counter = data.counter.map(
    (row): PrintLine => ({ key: row.tickId, quantity: row.quantity, name: row.name, sub: unitText(row, dict) || undefined }),
  )
  const notes = data.notes.filter((note) => !note.pending)
  const orders = data.orders.filter((order) => !order.pending)

  return (
    <div className="hidden flex-col gap-6 bg-background text-body text-print print:flex">
      <PrintPageRules
        running={fill(dict.printRunning, { bakery: data.bakeryName, day: data.title })}
        continued={dict.printContinued}
        footer={data.title}
        pageTemplate={dict.printPage}
      />
      <header className="flex items-end justify-between gap-4 border-b-2 border-print pb-3">
        <div className="flex flex-col">
          <span className="font-semibold">{data.bakeryName}</span>
          <span className="font-display text-glance-lg font-semibold">{data.title}</span>
        </div>
        <div className="flex flex-col items-end text-right tabular-nums">
          <span className="font-semibold">{summaryText(data, dict, false)}</span>
          <span>{fill(dict.printAsOf, { time: data.asOf })}</span>
        </div>
      </header>

      <PrintStale text={dict.printStale} />
      {data.pendingCount > 0 ? <p>{fill(dict.printPendingLeftOut, { pending: pendingText(data.pendingCount, dict) })}</p> : null}
      {notes.length > 0 ? <PrintNotes notes={notes} dict={dict} /> : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-h1">{dict.bakeTitle}</h2>
        {groups.length === 0 && made.length === 0 ? <p>{dict.printNothing}</p> : null}
        {groups.map((group) => (
          <PrintGroup key={group.title} title={group.title} lines={group.lines} />
        ))}
        {made.length > 0 ? <PrintGroup title={dict.madeTitle} lines={made} /> : null}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-h1">{dict.counterTitle}</h2>
        {counter.length > 0 ? <PrintGroup title={dict.counterHint} lines={counter} /> : <p>{dict.counterNone}</p>}
      </section>

      {orders.length > 0 ? <PrintPickups orders={orders} dict={dict} itemTemplate={itemTemplate} /> : null}
    </div>
  )
}
