import { planSummary } from "./copy"
import { SaveActions } from "./SaveActions"
import { SaveStatus } from "./SaveStatus"
import type { AdminCopy } from "./types"
import type { DayEditor } from "./useDayEditor"

type SaveCardProps = {
  editor: DayEditor
  dict: AdminCopy
}

/** From 1024px, at the foot of the sticky side column: what the day offers, where it stands, Discard · Save day. */
export function SaveCard({ editor, dict }: SaveCardProps) {
  return (
    <div className="hidden flex-col gap-3 rounded-panel border border-border p-3 lg:flex">
      <span className="font-semibold tabular-nums">{planSummary(editor.plan, dict)}</span>
      <SaveStatus editor={editor} dict={dict.calendarDay.save} />
      <SaveActions editor={editor} stretch dict={dict.calendarDay.save} />
    </div>
  )
}
