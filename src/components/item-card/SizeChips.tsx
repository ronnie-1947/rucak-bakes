"use client"

import { Chip } from "@/components/ui/Chip"

type SizeChipsProps = {
  /** The row's id; each chip is `${id}-${value}`, so focus can land on the picked one. */
  id: string
  /** "0.5 kg" … or "1", "2" … — `value` is grams or a count. */
  options: { value: number; label: string }[]
  /** Weights take two columns until the card is wide enough for four. */
  byWeight: boolean
  /** Null until one is picked. */
  value: number | null
  onPick: (value: number) => void
  /** "Select quantity" — over the chips. */
  title: string
  /** "Select quantity for Butterscotch cake" — the group's accessible name. */
  label: string
}

/** Four counts always fit in a row; four weights need a 256px card — two by two below that. */
const columns: Record<"weight" | "count", string> = {
  weight: "grid-cols-2 @3xs:grid-cols-4",
  count: "grid-cols-4",
}

/**
 * The card's few sizes under a small "Select quantity" label: compact chips (32px, a 40px tap height) in an even grid that
 * fills the card's width, the picked one outlined in the accent. The grid follows the card's own width (a container query).
 */
export function SizeChips({ id, options, byWeight, value, onPick, title, label }: SizeChipsProps) {
  return (
    <div className="@container flex flex-col gap-1">
      <span aria-hidden className="text-micro font-semibold text-muted uppercase">
        {title}
      </span>
      <div id={id} role="group" aria-label={label} className={`grid gap-x-1 gap-y-2 py-1 ${columns[byWeight ? "weight" : "count"]}`}>
        {options.map((option) => (
          <Chip
            key={option.value}
            id={`${id}-${option.value}`}
            selected={option.value === value}
            tone="option"
            size="compact"
            className="tabular-nums"
            onClick={() => onPick(option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}
