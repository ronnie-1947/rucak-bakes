"use client"

import { useId } from "react"
import { Field } from "@/components/ui/Field"
import { inputShellClasses } from "@/components/ui/TextInput"
import type { SocialKind } from "@/lib/settings/social"
import type { SettingsCopy } from "./types"

type SocialFieldProps = {
  kind: SocialKind
  value: string
  onChange: (value: string) => void
  error?: string
  dict: SettingsCopy["bakery"]["social"]
}

/** The domain fixed in front, then the handle — a pasted link or an @handle works too; it saves as the bare handle. */
export function SocialField({ kind, value, onChange, error, dict }: SocialFieldProps) {
  const id = useId()
  const d = dict[kind]
  return (
    <Field id={id} label={d.label} hint={dict.hint} error={error}>
      <div className={inputShellClasses(error ? "invalid" : "valid")}>
        <span aria-hidden className="flex shrink-0 items-center border-r border-border bg-sunken px-3 text-muted">
          {d.prefix}
        </span>
        <input
          id={id}
          type="text"
          value={value}
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={d.placeholder}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={`${id}-message`}
          onChange={(event) => onChange(event.target.value.slice(0, 200))}
          className="min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-subtle"
        />
      </div>
    </Field>
  )
}
