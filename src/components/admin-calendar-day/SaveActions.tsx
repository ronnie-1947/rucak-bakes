import { Button } from "@/components/ui/Button"
import type { DayCopy } from "./types"
import type { DayEditor } from "./useDayEditor"

type SaveActionsProps = {
  editor: DayEditor
  /** The card stretches Save across the rest of its row; the bar keeps it compact. */
  stretch: boolean
  dict: DayCopy["save"]
}

const saveWidths: Record<"stretch" | "compact", string> = {
  stretch: "flex-1",
  compact: "px-6",
}

/** Discard (while there are changes) and Save day — disabled while there's a conflict, with the status line saying so. */
export function SaveActions({ editor, stretch, dict }: SaveActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {editor.dirty && !editor.pending ? (
        <Button variant="ghost" className="text-muted" onClick={editor.discard}>
          {dict.discard}
        </Button>
      ) : null}
      <Button variant="primary" className={saveWidths[stretch ? "stretch" : "compact"]} disabled={!editor.canSave} onClick={() => editor.save()}>
        {editor.pending ? dict.saving : dict.save}
      </Button>
    </div>
  )
}
