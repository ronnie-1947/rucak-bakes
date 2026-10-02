import { fill } from "@/lib/template"
import type { DayCopy } from "./types"
import type { DayEditor, SaveState } from "./useDayEditor"

type SaveStatusProps = {
  editor: DayEditor
  dict: DayCopy["save"]
}

const dots: Record<SaveState, string> = {
  saved: "bg-green",
  conflicts: "bg-red",
  prices: "bg-red",
  unsaved: "bg-o500",
  clean: "bg-border-strong",
}

const words: Record<SaveState, string> = {
  saved: "text-green",
  conflicts: "text-red",
  prices: "text-red",
  unsaved: "text-foreground",
  clean: "text-muted",
}

/**
 * Where the day stands — and, when Save is disabled, why: "1 quantity conflict — fix to save". Below it, what
 * went wrong with the last save, if anything.
 */
export function SaveStatus({ editor, dict }: SaveStatusProps) {
  const conflicts = editor.conflicts.length
  const prices = editor.priceIssues.length
  const text: Record<SaveState, string> = {
    saved: dict.saved,
    conflicts: conflicts === 1 ? dict.conflictsOne : fill(dict.conflicts, { count: conflicts }),
    prices: prices === 1 ? dict.pricesOne : fill(dict.prices, { count: prices }),
    unsaved: editor.changes === 1 ? dict.unsavedOne : fill(dict.unsaved, { count: editor.changes }),
    clean: dict.clean,
  }
  const problems: Record<NonNullable<DayEditor["problem"]>, string> = {
    failed: dict.failed,
    refreshed: dict.refreshed,
    unavailable: dict.unavailable,
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span role="status" className="flex items-center gap-2">
        <span aria-hidden className={`size-2 shrink-0 rounded-pill ${dots[editor.saveState]}`} />
        <span className={`text-small-admin font-semibold tabular-nums ${words[editor.saveState]}`}>{text[editor.saveState]}</span>
      </span>
      {editor.problem ? (
        <span role="alert" className="text-small-admin text-pretty text-red">
          {problems[editor.problem]}
        </span>
      ) : null}
    </div>
  )
}
