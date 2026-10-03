import { Button } from "@/components/ui/Button"
import { SaveStatus } from "./SaveStatus"
import type { SettingsCopy } from "./types"
import type { SaveProblem } from "./useSectionForm"

/** What the bar needs from a section form. */
export type SaveControls = {
  problemCount: number
  changes: number
  canSave: boolean
  pending: boolean
  problem: SaveProblem | null
  save: () => void
  discard: () => void
}

type Placement = "top" | "bottom"

type SaveBarProps = {
  form: SaveControls
  /** Below 1280px it sticks to the bottom of the screen; from 1280px to the top of the pane, beside the preview. */
  placement: Placement
  dict: SettingsCopy["save"]
}

const placements: Record<Placement, string> = {
  top: "sticky top-0 hidden -mx-3 rounded-panel border border-border px-3 py-2 xl:flex",
  bottom: "sticky bottom-0 -mx-4 flex border-t border-border px-4 pt-3 pb-safe md:-mx-6 md:px-6 xl:hidden",
}

/** The section's save bar — only while it has changes (or a save just failed). Discard · Save changes. */
export function SaveBar({ form, placement, dict }: SaveBarProps) {
  return (
    <div className={`z-20 flex-wrap items-center gap-2 bg-background shadow-raised ${placements[placement]}`}>
      <div className="min-w-40 flex-1">
        <SaveStatus problemCount={form.problemCount} changes={form.changes} problem={form.problem} dict={dict} />
      </div>
      <div className="flex items-center gap-2">
        {form.pending ? null : (
          <Button variant="ghost" className="text-muted" onClick={form.discard}>
            {dict.discard}
          </Button>
        )}
        <Button variant="primary" className="px-6" disabled={!form.canSave} onClick={form.save}>
          {form.pending ? dict.saving : dict.save}
        </Button>
      </div>
    </div>
  )
}
