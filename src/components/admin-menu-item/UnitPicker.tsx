"use client"

import { useId } from "react"
import { type PriceUnit, priceUnits } from "@/lib/menu/units"
import type { ItemCopy } from "./types"

type UnitPickerProps = {
  value: PriceUnit
  onChange: (value: PriceUnit) => void
  /** "Customers see ₹70 each" */
  help: string
  dict: ItemCopy["basics"]
}

const segments: Record<"on" | "off", string> = {
  on: "bg-o500 font-semibold",
  off: "font-medium hover:bg-sunken",
}

/** Each / Per box / Per kg / Per slice as one segmented radio group, with what customers will read under it. */
export function UnitPicker({ value, onChange, help, dict }: UnitPickerProps) {
  const labelId = useId()
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span id={labelId} className="text-small-admin text-muted">
        {dict.unit}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="grid h-11 grid-cols-4 gap-1 rounded-field border border-border p-1">
        {priceUnits.map((unit) => (
          <button
            key={unit}
            type="button"
            role="radio"
            aria-checked={unit === value}
            onClick={() => onChange(unit)}
            className={`min-w-0 truncate rounded-chip px-1 text-small-admin text-foreground focus-visible:outline-2 focus-visible:outline-o700 ${segments[unit === value ? "on" : "off"]}`}
          >
            {dict.units[unit]}
          </button>
        ))}
      </div>
      <span className="text-small-admin text-muted tabular-nums">{help}</span>
    </div>
  )
}
