import type { BakeGroup, MadeRow } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import { BakeSection } from "./BakeSection"
import { MadeSection } from "./MadeSection"
import { TickProgress } from "./TickProgress"
import type { DaySheetCopy } from "./types"

type BakeListProps = {
  /** Groups already narrowed to the rows this view shows. */
  groups: BakeGroup[]
  /** Made to order lines, narrowed the same way. */
  made: MadeRow[]
  showPending: boolean
  /** Pending orders on the day — what the empty line says when none is verified yet. */
  pendingCount: number
  dict: DaySheetCopy
}

/**
 * "For orders" — totalled from the day's orders: progress across every tickable row, each category, then Made to order.
 * Nothing to count: "No orders for this day", or how many pending orders wait to be verified.
 */
export function BakeList({ groups, made, showPending, pendingCount, dict }: BakeListProps) {
  const rows = [
    ...groups.flatMap((group) => group.rows.filter((row) => row.verified > 0).map((row) => ({ kind: "item" as const, id: row.menuItemId }))),
    ...made.filter((row) => !row.pending).map((row) => ({ kind: "line" as const, id: row.lineId })),
  ]
  const empty = groups.length === 0 && made.length === 0
  const waiting = pendingCount === 1 ? dict.bakeNonePendingOne : fill(dict.bakeNonePending, { count: pendingCount })
  const none = pendingCount > 0 && !showPending ? waiting : dict.bakeNone

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col">
        <h2 className="text-h1">{dict.bakeTitle}</h2>
        <span className="text-small text-muted">{dict.bakeHint}</span>
      </div>
      {empty ? (
        <p className="rounded-panel bg-sunken p-4 text-pretty text-muted">{none}</p>
      ) : (
        <>
          {rows.length > 0 ? <TickProgress rows={rows} template={dict.bakeProgress} meterLabel={dict.bakeProgressLabel} dict={dict} /> : null}
          {groups.map((group) => (
            <BakeSection key={group.name ?? ""} title={group.name ?? dict.uncategorised} rows={group.rows} showPending={showPending} dict={dict} />
          ))}
          {made.length > 0 ? <MadeSection rows={made} dict={dict} /> : null}
        </>
      )}
    </section>
  )
}
