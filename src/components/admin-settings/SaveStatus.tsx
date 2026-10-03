import { saveText } from "./copy"
import type { SettingsCopy } from "./types"
import type { SaveProblem } from "./useSectionForm"

type SaveStatusProps = {
  problemCount: number
  changes: number
  problem: SaveProblem | null
  dict: SettingsCopy["save"]
}

type Tone = "problems" | "unsaved"

const dots: Record<Tone, string> = {
  problems: "bg-red",
  unsaved: "bg-o500",
}

const words: Record<Tone, string> = {
  problems: "text-red",
  unsaved: "text-foreground",
}

/** "3 unsaved changes", or — when Save is held back — "Fix 1 problem to save". Under it, why the last save failed. */
export function SaveStatus({ problemCount, changes, problem, dict }: SaveStatusProps) {
  const tone: Tone = problemCount > 0 ? "problems" : "unsaved"
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span role="status" className="flex items-center gap-2">
        <span aria-hidden className={`size-2 shrink-0 rounded-pill ${dots[tone]}`} />
        <span className={`text-small-admin font-semibold tabular-nums ${words[tone]}`}>{saveText(problemCount, changes, dict)}</span>
      </span>
      {problem ? (
        <span role="alert" className="text-small-admin text-pretty text-red">
          {dict[problem]}
        </span>
      ) : null}
    </div>
  )
}
