"use client"

import { useState, useTransition } from "react"
import { saveCustomerNote } from "@/app/actions/customers"
import { Button } from "@/components/ui/Button"
import { inputClasses } from "@/components/ui/TextInput"
import { CUSTOMER_LIMITS } from "@/lib/customers/limits"
import type { DetailCopy } from "./types"

type NoteCardProps = {
  customerId: string
  note: string | null
  dict: DetailCopy["note"]
}

type Saved = "idle" | "saved" | "failed"

/** The team's note about a customer — one shared text, saved on demand. Customers never see it. */
export function NoteCard({ customerId, note, dict }: NoteCardProps) {
  const [draft, setDraft] = useState(note ?? "")
  const [saved, setSaved] = useState<Saved>("idle")
  const [pending, startTransition] = useTransition()
  const dirty = draft.trim() !== (note ?? "")

  return (
    <section className="flex flex-col gap-3 rounded-panel border border-border p-3">
      <div className="flex flex-col">
        <label htmlFor="customer-note" className="font-semibold">
          {dict.title}
        </label>
        <span id="customer-note-hint" className="text-small-admin text-muted">
          {dict.hint}
        </span>
      </div>
      <textarea
        id="customer-note"
        rows={3}
        value={draft}
        maxLength={CUSTOMER_LIMITS.note}
        placeholder={dict.placeholder}
        aria-describedby="customer-note-hint customer-note-status"
        onChange={(event) => {
          setDraft(event.target.value)
          setSaved("idle")
        }}
        className={inputClasses(false, "min-h-24 resize-y py-2")}
      />
      <div className="flex items-center justify-between gap-2">
        <span id="customer-note-status" role="status" className="text-small-admin">
          {saved === "saved" ? <span className="text-green">{dict.saved}</span> : saved === "failed" ? <span className="text-red">{dict.failed}</span> : null}
        </span>
        <Button
          variant="outlineLink"
          disabled={!dirty || pending}
          onClick={() =>
            startTransition(async () => {
              const result = await saveCustomerNote({ id: customerId, note: draft })
              setSaved(result.ok ? "saved" : "failed")
            })
          }
        >
          {dict.save}
        </Button>
      </div>
    </section>
  )
}
