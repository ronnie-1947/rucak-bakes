import { CheckIcon } from "@/components/ui/icons/CheckIcon"
import type { SettingsCopy } from "./types"
import type { LiveMarkState } from "./useLiveSave"

type LiveMarkProps = {
  mark: LiveMarkState
  dict: SettingsCopy["live"]
}

/** "SAVES INSTANTLY" beside a switch that has no Save button, then "✓ Saved" (or why not) once it has. */
export function LiveMark({ mark, dict }: LiveMarkProps) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="rounded-chip border border-border bg-sunken px-2 text-micro font-semibold text-muted uppercase">{dict.tag}</span>
      {mark === "saved" ? (
        <span role="status" className="flex items-center gap-1 text-small-admin font-semibold text-green">
          <CheckIcon className="size-3.5" />
          {dict.saved}
        </span>
      ) : null}
      {mark === "failed" ? (
        <span role="alert" className="text-small-admin font-semibold text-red">
          {dict.failed}
        </span>
      ) : null}
    </span>
  )
}
