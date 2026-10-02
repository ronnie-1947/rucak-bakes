"use client"

import { Button } from "@/components/ui/Button"
import type { ItemCopy } from "./types"
import type { ItemForm } from "./useItemForm"

type SaveActionsProps = {
  form: ItemForm
  creating: boolean
  dict: ItemCopy["save"]
}

/** Discard (while there are changes), Save and add another (creating), and the primary Save / Create. */
export function SaveActions({ form, creating, dict }: SaveActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {form.dirty && !form.pending ? (
        <Button variant="ghost" className="text-muted" onClick={form.discard}>
          {dict.discard}
        </Button>
      ) : null}
      {creating ? (
        <Button variant="outline" disabled={!form.canSave} onClick={() => form.save(true)}>
          {dict.saveAnother}
        </Button>
      ) : null}
      <Button variant="primary" disabled={!form.canSave} onClick={() => form.save()}>
        {form.pending ? dict.saving : creating ? dict.create : dict.save}
      </Button>
    </div>
  )
}
