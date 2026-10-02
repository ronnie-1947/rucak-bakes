"use client"

import { useId } from "react"
import { Icon } from "@/components/ui/icons/Icon"
import { type Allergen, allergens } from "@/lib/menu/allergens"
import type { AdminCopy } from "./types"

type AllergenPickerProps = {
  value: Allergen[]
  onChange: (value: Allergen[]) => void
  dict: AdminCopy
}

const looks: Record<"on" | "off", string> = {
  on: "border-red bg-red-soft font-semibold text-red",
  off: "border-border-strong bg-background font-medium text-foreground hover:bg-sunken",
}

/** The fixed allergen list as toggles — red-tinted with a warning glyph when declared, so they never read as ordinary tags. */
export function AllergenPicker({ value, onChange, dict }: AllergenPickerProps) {
  const labelId = useId()
  const d = dict.menuItem.details
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <span id={labelId} className="text-small-admin text-muted">
        {d.allergens}
      </span>
      <div className="flex flex-wrap gap-2">
        {allergens.map((allergen) => {
          const on = value.includes(allergen)
          return (
            <button
              key={allergen}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((existing) => existing !== allergen) : [...value, allergen])}
              className={`inline-flex min-h-11 items-center gap-2 rounded-chip border px-3 text-small-admin focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${looks[on ? "on" : "off"]}`}
            >
              <Icon name="alert" className="size-3.5" strokeWidth={2.2} />
              <span>{dict.allergens[allergen]}</span>
            </button>
          )
        })}
      </div>
      <span className="text-small-admin text-muted">{d.allergensHint}</span>
    </div>
  )
}
