"use client"

import { useId } from "react"
import { Field } from "@/components/ui/Field"
import { inputShellClasses } from "@/components/ui/TextInput"
import type { SettingsCopy } from "./types"

type PhoneFieldProps = {
  value: string
  onChange: (value: string) => void
  error?: string
  dict: SettingsCopy["bakery"]
}

/** +91, then the ten digits — spaces as typed, checked and turned into +91… when saved. */
export function PhoneField({ value, onChange, error, dict }: PhoneFieldProps) {
  const id = useId()
  return (
    <Field id={id} label={dict.phone} hint={dict.phoneHint} error={error}>
      <div className={inputShellClasses(error ? "invalid" : "valid")}>
        <span aria-hidden className="flex shrink-0 items-center border-r border-border bg-sunken px-3 text-muted tabular-nums">
          {dict.phonePrefix}
        </span>
        <input
          id={id}
          type="tel"
          value={value}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={dict.phonePlaceholder}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={`${id}-message`}
          onChange={(event) => onChange(event.target.value.replace(/[^\d\s-]/g, "").slice(0, 16))}
          className="min-w-0 flex-1 bg-transparent px-3 tabular-nums outline-none placeholder:text-subtle"
        />
      </div>
    </Field>
  )
}
