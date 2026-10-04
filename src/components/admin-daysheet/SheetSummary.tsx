import type { DaySheetData } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import { pendingLine, pendingText, summaryText } from "./copy"
import { PendingSwitch } from "./PendingSwitch"
import type { DaySheetCopy } from "./types"

type SheetSummaryProps = {
  data: DaySheetData
  dict: DaySheetCopy
}

/**
 * The day in one line — "6 orders · 23 ordered items · 4 counter-items (86 pieces) · first pickup 7:30am · last 12:30pm" —
 * then what For orders counts, and the Include pending switch while there are pending orders on a day that isn't closed.
 */
export function SheetSummary({ data, dict }: SheetSummaryProps) {
  const pending = pendingText(data.pendingCount, dict)

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="flex flex-col">
        <span className="font-semibold tabular-nums">{summaryText(data, dict)}</span>
        <span className="text-small text-pretty text-muted tabular-nums">{pendingLine(data, dict)}</span>
      </div>
      {data.pendingCount > 0 && !data.closed ? (
        <PendingSwitch on={data.params.pending} href={data.hrefs.togglePending} label={fill(dict.includePending, { pending })} />
      ) : null}
    </div>
  )
}
