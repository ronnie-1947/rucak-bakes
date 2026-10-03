import type { ReactNode } from "react"
import { fill } from "@/lib/template"
import { SaveBar, type SaveControls } from "./SaveBar"
import type { SettingsCopy } from "./types"

type FormFrameProps = {
  form: SaveControls & { dirty: boolean; savedAt: string | null }
  /** Staff see the section; the bars never appear for them. */
  canEdit: boolean
  dict: SettingsCopy["save"]
  children: ReactNode
}

/**
 * A section that saves as a form: the save bar (top from 1280px, bottom below), and "Saved · 11:02" after a
 * save until the next edit. The bars come and go with the changes — nothing to save, no bar.
 */
export function FormFrame({ form, canEdit, dict, children }: FormFrameProps) {
  const showBar = canEdit && (form.dirty || form.problem !== null)
  return (
    <div className="flex flex-col gap-4">
      {showBar ? <SaveBar form={form} placement="top" dict={dict} /> : null}
      {form.savedAt && !form.dirty ? (
        <span role="status" className="self-start rounded-pill bg-green-soft px-3 py-1 text-small-admin font-semibold text-green tabular-nums">
          {fill(dict.saved, { time: form.savedAt })}
        </span>
      ) : null}
      {children}
      {showBar ? <SaveBar form={form} placement="bottom" dict={dict} /> : null}
    </div>
  )
}
