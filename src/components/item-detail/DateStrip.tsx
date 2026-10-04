"use client"

import { type KeyboardEvent, useId, useRef } from "react"
import type { IsoDate } from "@/lib/dates"
import type { DateLook, DateOption } from "./availability"

type DateStripProps = {
  options: DateOption[]
  selected: IsoDate | null
  onSelect: (date: IsoDate) => void
  /** A date that can't be picked was tapped — say why. */
  onRefuse: (text: string) => void
  /** "Choose a pickup date" */
  label: string
}

type ChipLook = DateLook | "selected"

/** Open is white; picked is the large warm fill (o500, ink text); too soon and closed are grey; fully booked is red-soft. */
const chips: Record<ChipLook, string> = {
  selected: "border-o500 bg-o500 text-foreground",
  open: "border-border-strong bg-background text-foreground hover:bg-sunken",
  soon: "cursor-not-allowed border-border bg-sunken text-subtle",
  closed: "cursor-not-allowed border-border bg-sunken text-subtle",
  full: "cursor-not-allowed border-red-soft bg-red-soft text-red",
}

/** A closed date's number is struck through, so "closed" never rests on grey alone. */
const numbers: Record<DateLook, string> = {
  open: "",
  soon: "",
  closed: "line-through",
  full: "",
}

/**
 * The booking window's dates as a single-select listbox: 56×64 chips (weekday over the date), snap-scrolling and bleeding to
 * the screen edge on phones. A date that can't be picked stays focusable and says why when tapped. Arrow keys move through
 * every date, picking the open ones.
 */
export function DateStrip({ options, selected, onSelect, onRefuse, label }: DateStripProps) {
  const labelId = useId()
  const chipRefs = useRef(new Map<IsoDate, HTMLButtonElement>())
  const focusable = selected ?? options[0]?.date

  const choose = (option: DateOption) => {
    if (option.look === "open") onSelect(option.date)
    else if (option.refusal) onRefuse(option.refusal)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const at = options.findIndex((option) => option.date === (document.activeElement as HTMLElement | null)?.dataset.date)
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0
    const index = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : step && at >= 0 ? at + step : -1
    const next = options[index]
    if (!next) return
    event.preventDefault()
    chipRefs.current.get(next.date)?.focus()
    choose(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <span id={labelId} className="text-micro font-semibold text-muted uppercase">
        {label}
      </span>
      <div
        role="listbox"
        aria-labelledby={labelId}
        onKeyDown={onKeyDown}
        className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 py-0.5 scrollbar-none md:mx-0 md:scroll-px-0 md:px-0"
      >
        {options.map((option) => {
          const isSelected = option.date === selected
          return (
            <button
              key={option.date}
              ref={(node) => {
                if (node) chipRefs.current.set(option.date, node)
                else chipRefs.current.delete(option.date)
              }}
              type="button"
              role="option"
              data-date={option.date}
              aria-selected={isSelected}
              aria-disabled={option.look !== "open" || undefined}
              aria-label={option.label}
              title={option.status}
              tabIndex={option.date === focusable ? 0 : -1}
              onClick={() => choose(option)}
              className={`flex h-16 w-14 shrink-0 snap-start flex-col items-center justify-center rounded-button border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${chips[isSelected ? "selected" : option.look]}`}
            >
              <span className="text-micro font-medium">{option.weekday}</span>
              <span className={`text-h2 font-semibold tabular-nums ${numbers[option.look]}`}>{option.day}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
