import { Field } from "@/components/ui/Field"
import { Icon } from "@/components/ui/icons/Icon"
import { Tag } from "@/components/ui/Tag"
import { inputClasses, inputShellClasses, TextInput } from "@/components/ui/TextInput"
import { ADDRESS_MAX, type DetailsField, type DetailsValues, NAME_MAX } from "@/lib/orders/checkout"
import type { CartPageCopy, Fulfilment } from "./copy"
import { FulfilmentChoice } from "./FulfilmentChoice"

type DetailsFormProps = {
  values: DetailsValues
  onChange: (patch: Partial<DetailsValues>) => void
  /** Fields that failed — each shows its line in red. */
  errors: DetailsField[]
  /** Filled in from this device's last order. */
  welcome: boolean
  options: { type: Fulfilment; title: string; sub: string | null }[]
  copy: CartPageCopy
}

/** The ids the form's fields carry — Place order focuses the first one that needs fixing. */
export const FIELD_IDS: Record<DetailsField, string> = {
  name: "cart-name",
  phone: "cart-phone",
  address: "cart-address",
}

/** Name, phone, pickup or delivery, and the address when delivering. Nothing else — no account, no payment. */
export function DetailsForm({ values, onChange, errors, welcome, options, copy }: DetailsFormProps) {
  const d = copy.cart.details
  const failed = (field: DetailsField) => errors.includes(field)
  return (
    <div className="flex flex-col gap-4">
      {welcome ? (
        <Tag tone="green" size="pill" className="gap-2 self-start">
          <Icon name="check" className="size-4" strokeWidth={2.4} />
          {d.welcome}
        </Tag>
      ) : null}
      <Field id={FIELD_IDS.name} label={d.name} error={failed("name") ? d.nameError : undefined}>
        <TextInput
          id={FIELD_IDS.name}
          autoComplete="name"
          value={values.name}
          maxLength={NAME_MAX}
          invalid={failed("name")}
          aria-describedby={failed("name") ? `${FIELD_IDS.name}-message` : undefined}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </Field>
      <Field id={FIELD_IDS.phone} label={d.phone} hint={d.phoneHint} error={failed("phone") ? d.phoneError : undefined}>
        <div className={inputShellClasses(failed("phone") ? "invalid" : "valid")}>
          <span aria-hidden className="grid shrink-0 place-items-center border-r border-border bg-sunken px-3 text-muted tabular-nums">
            {d.phonePrefix}
          </span>
          <input
            id={FIELD_IDS.phone}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={values.phone}
            maxLength={20}
            aria-invalid={failed("phone") || undefined}
            aria-describedby={`${FIELD_IDS.phone}-message`}
            onChange={(event) => onChange({ phone: event.target.value })}
            className="min-w-0 flex-1 bg-transparent px-3 tabular-nums outline-none"
          />
        </div>
      </Field>
      {options.length > 0 ? <FulfilmentChoice legend={d.how} value={values.type} options={options} onChange={(type) => onChange({ type })} /> : null}
      {values.type === "DELIVERY" ? (
        <Field id={FIELD_IDS.address} label={d.address} error={failed("address") ? d.addressError : undefined}>
          <textarea
            id={FIELD_IDS.address}
            rows={3}
            autoComplete="street-address"
            value={values.address}
            maxLength={ADDRESS_MAX}
            aria-invalid={failed("address") || undefined}
            aria-describedby={failed("address") ? `${FIELD_IDS.address}-message` : undefined}
            onChange={(event) => onChange({ address: event.target.value })}
            className={inputClasses(failed("address"), "resize-y py-3")}
          />
        </Field>
      ) : null}
    </div>
  )
}
