import { useId } from "react"
import type { Mode, NewOrderCopy } from "./types"

type ModeChoiceProps = {
  value: Mode
  onChange: (mode: Mode) => void
  dict: NewOrderCopy["when"]
}

const MODES: Mode[] = ["PICKUP", "DELIVERY"]

/**
 * Pickup or delivery as two halves of one 48px frame — native radios underneath, so arrow keys and screen readers work
 * unaided; the chosen half takes the warm o500 fill. Both are always offered: Settings' switches govern the website.
 */
export function ModeChoice({ value, onChange, dict }: ModeChoiceProps) {
  const name = useId()
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{dict.mode}</legend>
      <div className="grid h-12 grid-cols-2 gap-1 rounded-button border border-border p-1">
        {MODES.map((mode) => (
          <label
            key={mode}
            className="flex cursor-pointer items-center justify-center rounded-chip font-medium has-checked:bg-o500 has-checked:font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-o700"
          >
            <input type="radio" name={name} value={mode} checked={value === mode} onChange={() => onChange(mode)} className="sr-only" />
            {mode === "PICKUP" ? dict.pickup : dict.delivery}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
