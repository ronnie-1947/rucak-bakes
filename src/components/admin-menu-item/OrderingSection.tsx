"use client"

import { useId } from "react"
import { Field } from "@/components/ui/Field"
import { Stepper } from "@/components/ui/Stepper"
import { Switch } from "@/components/ui/Switch"
import { NOTICE } from "@/lib/menu/form"
import type { NoticeRules } from "@/lib/menu/item"
import { noticeHelp, noticeValue } from "./copy"
import { FormSection } from "./FormSection"
import type { ItemCopy } from "./types"
import type { ItemForm } from "./useItemForm"

type OrderingSectionProps = {
  form: ItemForm
  /** Today and the default cutoff — what the notice line works the deadline out from. */
  rules: NoticeRules
  dict: ItemCopy
}

/**
 * Whether customers can order it online and how many days ahead; off, it shows on the menu with a Call button. Then
 * "Bake each order separately" — shown either way, since phone orders bake too.
 */
export function OrderingSection({ form, rules, dict }: OrderingSectionProps) {
  const o = dict.ordering
  const noticeId = useId()
  const { fields, set } = form

  return (
    <FormSection id="ordering" title={o.title}>
      <Switch
        checked={fields.orderable}
        onChange={() => set("orderable", !fields.orderable)}
        stateLabel={o.online}
        label={o.online}
        className="self-start"
      />
      {fields.orderable ? (
        <Field id={noticeId} label={o.notice} hint={noticeHelp(fields.noticeDays, rules, o)}>
          <Stepper
            id={noticeId}
            value={fields.noticeDays}
            min={NOTICE.min}
            max={NOTICE.max}
            onChange={(days) => set("noticeDays", days)}
            decreaseLabel={o.fewer}
            increaseLabel={o.more}
            display={noticeValue(fields.noticeDays, o)}
            describedBy={`${noticeId}-message`}
          />
        </Field>
      ) : (
        <p className="rounded-panel bg-sunken p-3 text-small-admin text-pretty">{o.callOnly}</p>
      )}
      <div className="flex flex-col gap-1 border-t border-border pt-3">
        <Switch
          checked={fields.bakeSeparately}
          onChange={() => set("bakeSeparately", !fields.bakeSeparately)}
          stateLabel={o.separately}
          label={o.separately}
          className="self-start"
        />
        <span className="text-small-admin text-pretty text-muted">{o.separatelyHint}</span>
      </div>
    </FormSection>
  )
}
