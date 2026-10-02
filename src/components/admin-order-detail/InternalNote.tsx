"use client"

import { useId, useState, useTransition } from "react"
import { saveInternalNote } from "@/app/actions/orders"
import { Button } from "@/components/ui/Button"
import type { DetailCopy } from "./types"

type InternalNoteProps = {
  orderId: string
  note: string | null
  dict: DetailCopy
}

type Saved = "idle" | "saved" | "failed"

/** The team's note on an order — one shared text, saved on demand. Customers never see it. */
export function InternalNote({ orderId, note, dict }: InternalNoteProps) {
  const id = useId()
  const [draft, setDraft] = useState(note ?? "")
  const [saved, setSaved] = useState<Saved>("idle")
  const [pending, startTransition] = useTransition()
  const dirty = draft.trim() !== (note ?? "")

  return (
    <section className="flex flex-col gap-2">
      <label htmlFor={id} className="text-micro font-semibold text-muted uppercase">
        {dict.internalNote}
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id={id}
          rows={2}
          value={draft}
          maxLength={1000}
          placeholder={dict.internalNotePlaceholder}
          aria-describedby={`${id}-hint`}
          onChange={(event) => {
            setDraft(event.target.value)
            setSaved("idle")
          }}
          className="min-h-11 flex-1 resize-y rounded-field border border-border px-3 py-2 text-body text-foreground placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 md:text-body-admin"
        />
        <Button
          variant="outlineLink"
          disabled={!dirty || pending}
          onClick={() =>
            startTransition(async () => {
              const result = await saveInternalNote({ id: orderId, note: draft })
              setSaved(result.ok ? "saved" : "failed")
            })
          }
        >
          {dict.save}
        </Button>
      </div>
      <p id={`${id}-hint`} role="status" className="text-small-admin text-muted">
        {saved === "saved" ? dict.saved : saved === "failed" ? <span className="text-red">{dict.saveFailed}</span> : dict.internalNoteHint}
      </p>
    </section>
  )
}
