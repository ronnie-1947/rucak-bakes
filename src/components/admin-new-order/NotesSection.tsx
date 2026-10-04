import { useId } from "react"
import { Tag } from "@/components/ui/Tag"
import { inputClasses } from "@/components/ui/TextInput"
import { mentionsAllergen } from "@/lib/daysheet/notes"
import { NOTE_MAX } from "@/lib/orders/checkout"
import { INTERNAL_NOTE_MAX } from "@/lib/orders/staff-order"
import { FormCard } from "./FormCard"
import type { NewOrderCopy } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type NotesSectionProps = {
  form: NewOrderForm
  dict: NewOrderCopy["notes"]
}

/**
 * The customer's note — the kitchen reads it on the day sheet, so a note naming an allergen gets the red Allergen tag and a
 * red frame here, as it will there — and the team's own note, which customers never see.
 */
export function NotesSection({ form, dict }: NotesSectionProps) {
  const noteId = useId()
  const internalId = useId()
  const allergen = mentionsAllergen(form.note)

  return (
    <FormCard id="new-order-notes" title={dict.title}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={noteId} className="text-small-admin text-muted">
            {dict.note}
          </label>
          {allergen ? <Tag tone="red">{dict.allergen}</Tag> : null}
        </div>
        <textarea
          id={noteId}
          rows={2}
          value={form.note}
          maxLength={NOTE_MAX}
          aria-describedby={`${noteId}-hint`}
          onChange={(event) => form.setNote(event.target.value)}
          className={inputClasses(allergen, "resize-y py-2")}
        />
        <span id={`${noteId}-hint`} className="text-small-admin text-pretty text-muted">
          {dict.noteHint}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={internalId} className="text-small-admin text-muted">
          {dict.internal}
        </label>
        <textarea
          id={internalId}
          rows={2}
          value={form.internalNote}
          maxLength={INTERNAL_NOTE_MAX}
          aria-describedby={`${internalId}-hint`}
          onChange={(event) => form.setInternalNote(event.target.value)}
          className={inputClasses(false, "resize-y py-2")}
        />
        <span id={`${internalId}-hint`} className="text-small-admin text-muted">
          {dict.internalHint}
        </span>
      </div>
    </FormCard>
  )
}
