"use client"

import { SelectField } from "@/components/ui/SelectField"
import { formatWeight, weightChoices } from "@/lib/menu/sizes"

type SizeSelectProps = {
  /** PER_KG: 0.5 kg … 5 kg, the value in grams. Otherwise a count, 1 … `max`. */
  byWeight: boolean
  /** Null until one is picked — the placeholder shows. */
  value: number | null
  max: number
  onChange: (value: number) => void
  /** "Select size" — the first, empty choice, while nothing is picked (an older cart line without a size). */
  placeholder: string
  /** "Size of Chocolate cake" — the select's accessible name. */
  label: string
}

/**
 * The item page's size picker — the phone's own select, 48px beside Add to cart. A by-weight item offers 0.5 kg steps, anything
 * else 1, 2, 3 …. The bar starts it on the smallest; with nothing picked it reads "Select size", which can't be picked back.
 */
export function SizeSelect({ byWeight, value, max, onChange, placeholder, label }: SizeSelectProps) {
  const choices = byWeight ? weightChoices : Array.from({ length: max }, (_, index) => index + 1)
  const options = choices.map((choice) => ({ value: String(choice), label: byWeight ? formatWeight(choice) : String(choice) }))
  return (
    <SelectField
      size="lg"
      aria-label={label}
      value={value === null ? "" : String(value)}
      onChange={(event) => onChange(Number(event.target.value))}
      options={value === null ? [{ value: "", label: placeholder }, ...options] : options}
      className="w-32 shrink-0"
    />
  )
}
