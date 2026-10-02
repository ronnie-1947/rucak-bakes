import { fill } from "@/lib/template"
import { planSummary } from "./copy"
import type { AdminCopy } from "./types"
import type { DayEditor } from "./useDayEditor"

type PlanStripProps = {
  editor: DayEditor
  dict: AdminCopy
}

/** Below 1024px: "6 items · 74 units available" pinned to the top of the list as it scrolls, with the conflict count. */
export function PlanStrip({ editor, dict }: PlanStripProps) {
  const s = dict.calendarDay.strip
  const count = editor.conflicts.length
  return (
    <div className="sticky top-0 z-20 -mx-4 flex h-11 items-center justify-between gap-2 border-y border-border bg-background px-4 shadow-raised md:-mx-6 md:px-6 lg:hidden">
      <span className="font-semibold tabular-nums">{planSummary(editor.plan, dict)}</span>
      {count > 0 ? (
        <span className="text-small-admin font-semibold text-red tabular-nums">{count === 1 ? s.conflictsOne : fill(s.conflicts, { count })}</span>
      ) : null}
    </div>
  )
}
