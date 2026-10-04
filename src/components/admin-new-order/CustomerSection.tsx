import { useId } from "react"
import { Field } from "@/components/ui/Field"
import { TextInput } from "@/components/ui/TextInput"
import { NAME_MAX } from "@/lib/orders/checkout"
import { KnownCustomer } from "./KnownCustomer"
import { PhoneField } from "./PhoneField"
import { FormCard } from "./FormCard"
import type { FormCopy } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type CustomerSectionProps = {
  form: NewOrderForm
  dict: FormCopy
}

/** Phone first; a full number is looked up at once — a known customer's card, or "New customer". Then the name. */
export function CustomerSection({ form, dict }: CustomerSectionProps) {
  const nameId = useId()
  const c = dict.newOrder.customer
  const { state, customer } = form.lookup

  return (
    <FormCard id="new-order-customer" title={c.title}>
      <PhoneField value={form.phone} onChange={form.changePhone} dict={c} />
      {state === "found" && customer ? <KnownCustomer customer={customer} onLeave={form.guard} dict={dict} /> : null}
      <p role="status" className="text-small-admin text-muted empty:hidden">
        {state === "looking" ? c.looking : state === "new" ? c.isNew : state === "failed" ? c.lookupFailed : ""}
      </p>
      <Field id={nameId} label={c.name}>
        <TextInput
          id={nameId}
          value={form.name}
          maxLength={NAME_MAX}
          autoComplete="off"
          placeholder={c.namePlaceholder}
          onChange={(event) => form.changeName(event.target.value)}
          className="h-12"
        />
      </Field>
    </FormCard>
  )
}
