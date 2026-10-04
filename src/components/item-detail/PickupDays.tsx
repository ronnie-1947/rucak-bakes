"use client"

import { type KeyboardEvent, useId, useRef } from "react"
import { chipClasses, type ChipTone } from "@/components/ui/Chip"
import type { IsoDate } from "@/lib/dates"
import type { DayLook, DayOption } from "./availability"

type PickupDaysProps = {
  options: DayOption[]
  selected: IsoDate | null
  onSelect: (date: IsoDate) => void
  /** "Pickup day" */
  label: string
}

const tones: Record<DayLook, ChipTone> = {
  open: "warm",
  unavailable: "red",
  off: "plain",
}

/** Struck through as well as red, so "can't be had" never rests on colour alone. */
const strikes: Record<DayLook, string> = {
  open: "",
  unavailable: "line-through",
  off: "",
}

/**
 * One chip per day, as a radio group: warm when it takes the order (selected: the o500 fill), red and struck
 * through when it has the item but can't take it, disabled when the item isn't on that day's menu. Arrow keys
 * move between the days that can be picked.
 */
export function PickupDays({ options, selected, onSelect, label }: PickupDaysProps) {
  const labelId = useId()
  const chips = useRef(new Map<IsoDate, HTMLButtonElement>())
  const pickable = options.filter((option) => option.look !== "off")
  const focusable = selected ?? pickable[0]?.date

  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0
    if (!step || pickable.length === 0) return
    event.preventDefault()
    const at = pickable.findIndex((option) => option.date === focusable)
    const next = pickable[(at + step + pickable.length) % pickable.length]
    onSelect(next.date)
    chips.current.get(next.date)?.focus()
  }

  return (
    <div className="flex flex-col gap-3">
      <span id={labelId} className="text-micro font-semibold text-muted uppercase">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = option.date === selected
          return (
            <button
              key={option.date}
              ref={(node) => {
                if (node) chips.current.set(option.date, node)
                else chips.current.delete(option.date)
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={option.ariaLabel}
              tabIndex={option.date === focusable ? 0 : -1}
              disabled={option.look === "off"}
              onClick={() => onSelect(option.date)}
              className={chipClasses(checked, `min-w-11 ${strikes[option.look]}`, { tone: tones[option.look], size: "customer" })}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
