import { SaveActions } from "./SaveActions"
import { SaveStatus } from "./SaveStatus"
import type { DayCopy } from "./types"
import type { DayEditor } from "./useDayEditor"

type SaveBarProps = {
  editor: DayEditor
  dict: DayCopy["save"]
}

/** Below 1024px: sticks to the bottom of the scroll area while there's something to save (or just was), clear of the home indicator. */
export function SaveBar({ editor, dict }: SaveBarProps) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-background px-4 pt-3 pb-safe shadow-raised md:px-6 lg:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-40 flex-1">
          <SaveStatus editor={editor} dict={dict} />
        </div>
        <SaveActions editor={editor} stretch={false} dict={dict} />
      </div>
    </div>
  )
}
