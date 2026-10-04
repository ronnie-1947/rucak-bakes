import { useId } from "react"
import { Field } from "@/components/ui/Field"
import { inputShellClasses } from "@/components/ui/TextInput"
import type { NewOrderCopy } from "./types"

type PhoneFieldProps = {
  value: string
  onChange: (raw: string) => void
  dict: NewOrderCopy["customer"]
}

/**
 * The first thing staff type, while the customer reads it out: a fixed "+91" cell, the phone's number pad, spaced
 * "98765 43210" as it's typed. Not autofilled — the device's own number is never the customer's.
 */
export function PhoneField({ value, onChange, dict }: PhoneFieldProps) {
  const id = useId()
  return (
    <Field id={id} label={dict.phone}>
      <div className={inputShellClasses("valid", "h-12")}>
        <span aria-hidden className="grid w-12 shrink-0 place-items-center border-r border-border bg-sunken text-muted tabular-nums">
          {dict.phonePrefix}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={value}
          placeholder={dict.phonePlaceholder}
          aria-label={dict.phoneLabel}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 text-body tabular-nums outline-none placeholder:text-subtle"
        />
      </div>
    </Field>
  )
}
