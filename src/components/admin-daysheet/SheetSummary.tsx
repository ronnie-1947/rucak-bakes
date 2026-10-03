import type { DaySheetData } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import { pendingText, summaryText } from "./copy"
import { PendingSwitch } from "./PendingSwitch"
import type { DaySheetCopy } from "./types"

type SheetSummaryProps = {
  data: DaySheetData
  dict: DaySheetCopy
}

/** The day in one line — "6 orders · 23 items · first pickup 07:30 · last pickup 12:00" — then what the totals count. */
export function SheetSummary({ data, dict }: SheetSummaryProps) {
  const pending = pendingText(data.pendingCount, dict)
  const pendingLine = data.pendingCount === 0 ? dict.allVerified : data.params.pending ? dict.pendingShown : fill(dict.pendingHidden, { pending })

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="flex flex-col">
        <span className="font-semibold tabular-nums">{summaryText(data, dict)}</span>
        <span className="text-small text-muted tabular-nums">{pendingLine}</span>
      </div>
      {data.pendingCount > 0 ? <PendingSwitch on={data.params.pending} href={data.hrefs.togglePending} label={fill(dict.includePending, { pending })} /> : null}
    </div>
  )
}
