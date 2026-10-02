"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { fill } from "@/lib/template"
import { changesText } from "./copy"
import type { ItemCopy } from "./types"
import type { ItemForm, SaveState } from "./useItemForm"

type SaveStatusProps = {
  form: ItemForm
  dict: ItemCopy
}

const dots: Record<SaveState, string> = {
  saved: "bg-green",
  created: "bg-green",
  fix: "bg-red",
  unsaved: "bg-o500",
  createPrompt: "bg-border-strong",
  clean: "bg-border-strong",
}

const words: Record<SaveState, string> = {
  saved: "text-green",
  created: "text-green",
  fix: "text-red",
  unsaved: "text-foreground",
  createPrompt: "text-muted",
  clean: "text-muted",
}

/** The dot and line that say where the form stands — "2 unsaved changes · See changes" — and the list when asked. */
export function SaveStatus({ form, dict }: SaveStatusProps) {
  const [open, setOpen] = useState(false)
  const s = dict.save
  const count = form.saveState === "fix" ? form.problems.length : form.changes.length
  const text: Record<SaveState, string> = {
    saved: s.saved,
    created: s.created,
    fix: count === 1 ? s.fixOne : fill(s.fix, { count }),
    unsaved: count === 1 ? s.unsavedOne : fill(s.unsaved, { count }),
    createPrompt: s.createPrompt,
    clean: s.clean,
  }
  const listable = form.saveState === "unsaved"

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div role="status" className="flex flex-wrap items-center gap-x-2">
        <span aria-hidden className={`size-2 shrink-0 rounded-pill ${dots[form.saveState]}`} />
        <span className={`text-small-admin font-semibold tabular-nums ${words[form.saveState]}`}>{text[form.saveState]}</span>
        {listable ? (
          <Button variant="link" size="inline" className="px-1" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {s.seeChanges}
          </Button>
        ) : null}
      </div>
      {listable && open ? <span className="text-small-admin text-muted">{fill(s.changed, { list: changesText(form.changes, dict) })}</span> : null}
      {form.saveFailed ? (
        <span role="alert" className="text-small-admin text-red">
          {s.failed}
        </span>
      ) : null}
    </div>
  )
}
