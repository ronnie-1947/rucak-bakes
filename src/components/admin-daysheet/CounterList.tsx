import type { CounterRow as CounterRowData } from "@/lib/daysheet/queries"
import { CounterRow } from "./CounterRow"
import { TickProgress } from "./TickProgress"
import type { DaySheetCopy } from "./types"

type CounterListProps = {
  rows: CounterRowData[]
  dict: DaySheetCopy
}

/**
 * "Counter-items" — planned in the Calendar, not ordered online: progress, then each with the quantity made and its Baked
 * tick. None: "No counter-items today — orders only".
 */
export function CounterList({ rows, dict }: CounterListProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col">
        <h2 className="text-h1">{dict.counterTitle}</h2>
        <span className="text-small text-muted">{dict.counterHint}</span>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-panel bg-sunken p-4 text-muted">{dict.counterNone}</p>
      ) : (
        <>
          <TickProgress
            rows={rows.map((row) => ({ kind: "counter" as const, id: row.tickId }))}
            template={dict.bakeProgress}
            meterLabel={dict.counterProgressLabel}
            synced={false}
            dict={dict}
          />
          <ul>
            {rows.map((row) => (
              <CounterRow key={row.tickId} row={row} dict={dict} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
