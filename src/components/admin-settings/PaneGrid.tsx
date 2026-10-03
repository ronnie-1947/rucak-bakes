import type { ReactNode } from "react"
import { fill } from "@/lib/template"
import type { SettingsCopy } from "./types"

type Where = keyof SettingsCopy["preview"]["where"]

type PaneGridProps = {
  /** Staff see the settings with every control disabled. */
  canEdit: boolean
  /** The live preview — a column of its own from 1280px, not shown below that. */
  preview?: ReactNode
  where?: Where
  dict: SettingsCopy["preview"]
  children: ReactNode
}

/**
 * A section's body: its controls (one `@container`, so fields pair up by the column's own width, not the
 * window's), and from 1280px a sticky live preview beside them at 60 / 40.
 */
export function PaneGrid({ canEdit, preview, where, dict, children }: PaneGridProps) {
  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <fieldset disabled={!canEdit} className="min-w-0">
        <div className="@container">
          <div className="grid grid-cols-1 gap-6 pb-6 @xl:grid-cols-2">{children}</div>
        </div>
      </fieldset>
      {preview && where ? (
        <aside className="sticky top-18 hidden min-w-0 flex-col gap-3 pb-6 xl:flex">
          <span className="text-micro font-semibold text-muted uppercase">{fill(dict.label, { where: dict.where[where] })}</span>
          {preview}
        </aside>
      ) : null}
    </div>
  )
}
