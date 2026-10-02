"use client"

import { useId } from "react"
import { Field } from "@/components/ui/Field"
import { Stepper } from "@/components/ui/Stepper"
import { TextInput } from "@/components/ui/TextInput"
import { LIMITS, QUANTITY } from "@/lib/menu/form"
import { FormSection } from "./FormSection"
import type { ItemCopy } from "./types"
import type { ItemForm } from "./useItemForm"

type FulfilmentSectionProps = {
  form: ItemForm
  dict: ItemCopy
}

/** The starting quantity for a new day, and the size and storage lines the item page shows. */
export function FulfilmentSection({ form, dict }: FulfilmentSectionProps) {
  const f = dict.fulfilment
  const quantityId = useId()
  const sizeId = useId()
  const storageId = useId()
  const { fields, set } = form

  return (
    <FormSection id="fulfilment" title={f.title}>
      <Field id={quantityId} label={f.quantity} hint={f.quantityHint}>
        <Stepper
          id={quantityId}
          value={fields.defaultQuantity}
          min={QUANTITY.min}
          max={QUANTITY.max}
          onChange={(quantity) => set("defaultQuantity", quantity)}
          decreaseLabel={f.decrease}
          increaseLabel={f.increase}
          describedBy={`${quantityId}-message`}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id={sizeId} label={f.size} tag={dict.optional}>
          <TextInput
            id={sizeId}
            value={fields.sizeNote}
            maxLength={LIMITS.sizeNote}
            placeholder={f.sizePlaceholder}
            onChange={(event) => set("sizeNote", event.target.value)}
          />
        </Field>
        <Field id={storageId} label={f.storage} tag={dict.optional}>
          <TextInput
            id={storageId}
            value={fields.storageNote}
            maxLength={LIMITS.storageNote}
            placeholder={f.storagePlaceholder}
            onChange={(event) => set("storageNote", event.target.value)}
          />
        </Field>
      </div>
    </FormSection>
  )
}
