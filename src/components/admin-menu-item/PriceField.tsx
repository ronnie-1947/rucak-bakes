"use client"

import { useId } from "react"
import { Field } from "@/components/ui/Field"
import { inputClasses } from "@/components/ui/TextInput"
import type { ItemCopy } from "./types"

type PriceFieldProps = {
  value: string
  onChange: (value: string) => void
  error?: string
  required: string
  dict: ItemCopy["basics"]
}

/** ₹-prefixed price in rupees. Digits and one decimal point only; stored as paise. */
export function PriceField({ value, onChange, error, required, dict }: PriceFieldProps) {
  const id = useId()
  return (
    <Field id={id} label={dict.price} tag={required} hint={dict.priceHint} error={error}>
      <div
        className={inputClasses(
          Boolean(error),
          "flex items-stretch overflow-hidden px-0 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-o700",
        )}
      >
        <span aria-hidden className="flex w-9 shrink-0 items-center justify-center border-r border-border bg-sunken text-muted">
          ₹
        </span>
        <input
          id={id}
          value={value}
          inputMode="decimal"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={`${id}-message`}
          onChange={(event) => {
            const cleaned = event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1")
            const [whole, fraction] = cleaned.split(".")
            onChange(fraction === undefined ? whole.slice(0, 6) : `${whole.slice(0, 6)}.${fraction.slice(0, 2)}`)
          }}
          className="min-w-0 flex-1 bg-transparent px-3 tabular-nums outline-none"
        />
      </div>
    </Field>
  )
}
