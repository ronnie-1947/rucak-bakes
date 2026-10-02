"use client"

import { useId } from "react"
import { Field } from "@/components/ui/Field"
import { Switch } from "@/components/ui/Switch"
import { TextInput } from "@/components/ui/TextInput"
import { LIMITS, priceToPaise } from "@/lib/menu/form"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import { CategoryPicker } from "./CategoryPicker"
import { inlineError } from "./copy"
import { FormSection } from "./FormSection"
import { PriceField } from "./PriceField"
import { SlugLine } from "./SlugLine"
import type { AdminCopy } from "./types"
import { UnitPicker } from "./UnitPicker"
import type { ItemForm } from "./useItemForm"

type BasicsSectionProps = {
  form: ItemForm
  categories: { slug: string; name: string }[]
  /** Saved slug — null while creating. */
  savedSlug: string | null
  /** Upcoming days the saved item is on — for the "still on N days" line when it's switched off. */
  upcomingCount: number
  dict: AdminCopy
}

/** Name and web address, short description, category, price and unit, and the Active switch. */
export function BasicsSection({ form, categories, savedSlug, upcomingCount, dict }: BasicsSectionProps) {
  const d = dict.menuItem
  const b = d.basics
  const nameId = useId()
  const descriptionId = useId()
  const { fields, set, fieldErrors, tried, slugTaken } = form
  const shown = (code: string | undefined, values?: Record<string, string | number>) => (tried ? inlineError(code, d, values) : undefined)
  const length = fields.shortDescription.trim().length
  const paise = priceToPaise(fields.price)
  const slugError =
    shown(fieldErrors.slug) ??
    (tried && slugTaken !== null ? inlineError(slugTaken ? "slugTaken" : "slugTakenUnknown", d, { name: slugTaken }) : undefined)

  return (
    <FormSection id="basics" title={b.title} invalid={tried && (Object.keys(fieldErrors).length > 0 || slugTaken !== null)}>
      <Field id={nameId} label={b.name} tag={d.required} error={shown(fieldErrors.name)}>
        <TextInput
          id={nameId}
          value={fields.name}
          maxLength={LIMITS.name}
          invalid={Boolean(shown(fieldErrors.name))}
          aria-describedby={`${nameId}-message`}
          onChange={(event) => set("name", event.target.value)}
        />
      </Field>
      <SlugLine slug={fields.slug} savedSlug={savedSlug} onChange={(slug) => set("slug", slug)} error={slugError} dict={b} />

      <Field
        id={descriptionId}
        label={b.description}
        tag={d.required}
        hint={b.descriptionHint}
        error={shown(fieldErrors.shortDescription, { count: length })}
        counter={fill(b.count, { count: length, max: LIMITS.shortDescription })}
        counterOver={length > LIMITS.shortDescription}
      >
        <TextInput
          id={descriptionId}
          value={fields.shortDescription}
          invalid={Boolean(shown(fieldErrors.shortDescription)) || length > LIMITS.shortDescription}
          aria-describedby={`${descriptionId}-message`}
          onChange={(event) => set("shortDescription", event.target.value.slice(0, LIMITS.shortDescription + 40))}
        />
      </Field>

      <CategoryPicker
        value={fields.category}
        categories={categories}
        onChange={(category) => set("category", category)}
        error={shown(fieldErrors.category)}
        required={d.required}
        dict={b}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <PriceField value={fields.price} onChange={(price) => set("price", price)} error={shown(fieldErrors.price)} required={d.required} dict={b} />
        <UnitPicker
          value={fields.priceUnit}
          onChange={(unit) => set("priceUnit", unit)}
          help={fill(b.unitHelp, { price: paise === null ? b.noPrice : formatPaise(paise), unit: dict.priceUnits[fields.priceUnit] })}
          dict={b}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Switch
          checked={fields.isActive}
          onChange={() => set("isActive", !fields.isActive)}
          stateLabel={fields.isActive ? d.active : d.inactive}
          label={b.activeLabel}
          className="self-start"
        />
        <span className="text-small-admin text-pretty text-muted">
          {!fields.isActive && upcomingCount > 0 ? fill(b.inactiveScheduled, { count: upcomingCount }) : b.activeHint}
        </span>
      </div>
    </FormSection>
  )
}
