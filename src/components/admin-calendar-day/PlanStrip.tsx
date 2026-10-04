import { planSummary } from "./copy"
import type { AdminCopy } from "./types"
import type { DayEditor } from "./useDayEditor"

type PlanStripProps = {
  editor: DayEditor
  dict: AdminCopy
}

/** Below 1024px: "5 counter-items · 86 pieces" pinned to the top of the list as it scrolls. */
export function PlanStrip({ editor, dict }: PlanStripProps) {
  return (
    <div
      className="sticky top-0 z-20 -mx-4 flex h-11 items-center gap-2 border-y border-border bg-background px-4 shadow-raised md:-mx-6 md:px-6 lg:hidden"
    >
      <span className="font-semibold tabular-nums">{planSummary(editor.plan, dict)}</span>
    </div>
  )
}
