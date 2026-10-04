import { type KeyboardEvent, useId, useRef } from "react"
import type { IsoDate } from "@/lib/dates"
import type { DayLook, DayOption } from "./days"

type DayStripProps = {
  options: DayOption[]
  selected: IsoDate | null
  onSelect: (date: IsoDate) => void
  /** "Date" */
  label: string
  /** "Orange dot: past cutoff, too soon or full — you can still book it." */
  caption: string
}

type ChipLook = DayLook | "selected"

/** Picked is the large warm fill with ink text; full is red-soft; closed is grey, struck through and can't be picked. */
const chips: Record<ChipLook, string> = {
  selected: "border-o500 bg-o500 text-foreground",
  open: "border-border-strong bg-background text-foreground hover:bg-sunken",
  few: "border-border-strong bg-background text-foreground hover:bg-sunken",
  full: "border-red-soft bg-red-soft text-foreground",
  closed: "cursor-not-allowed border-border bg-sunken text-subtle",
}

/** The state word under the date: Open green, "2 left" orange, Full red — on the picked chip, ink. */
const words: Record<ChipLook, string> = {
  selected: "text-foreground",
  open: "text-green",
  few: "text-o700",
  full: "text-red",
  closed: "text-subtle",
}

const numbers: Record<DayLook, string> = {
  open: "",
  few: "",
  full: "",
  closed: "line-through",
}

/**
 * The booking window's days as a single-select listbox: 56×64 chips (weekday, date, state word), snap-scrolling and
 * bleeding to the card's edge on phones. Every day staff can book is pickable — an orange dot marks one customers can't
 * (past its cutoff, too soon for a line, or full). Arrow keys, Home and End move between the pickable days.
 */
export function DayStrip({ options, selected, onSelect, label, caption }: DayStripProps) {
  const labelId = useId()
  const chipRefs = useRef(new Map<IsoDate, HTMLButtonElement>())
  const pickable = options.filter((option) => option.look !== "closed")
  const focusable = pickable.find((option) => option.date === selected)?.date ?? pickable[0]?.date

  const onKeyDown = (event: KeyboardEvent) => {
    const at = pickable.findIndex((option) => option.date === (document.activeElement as HTMLElement | null)?.dataset.date)
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0
    const index = event.key === "Home" ? 0 : event.key === "End" ? pickable.length - 1 : step && at >= 0 ? at + step : -1
    const next = pickable[index]
    if (!next) return
    event.preventDefault()
    chipRefs.current.get(next.date)?.focus()
    onSelect(next.date)
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-small-admin text-muted">
        {label}
      </span>
      <div
        role="listbox"
        aria-labelledby={labelId}
        onKeyDown={onKeyDown}
        className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 py-0.5 scrollbar-none md:mx-0 md:scroll-px-0 md:px-0"
      >
        {options.map((option) => {
          const look: ChipLook = option.date === selected ? "selected" : option.look
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
              aria-selected={option.date === selected}
              aria-label={option.label}
              title={option.status}
              disabled={option.look === "closed"}
              tabIndex={option.date === focusable ? 0 : -1}
              onClick={() => onSelect(option.date)}
              className={`relative flex h-16 w-14 shrink-0 snap-start flex-col items-center justify-center rounded-button border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${chips[look]}`}
            >
              <span className="text-micro font-medium">{option.weekday}</span>
              <span className={`text-h2 font-semibold tabular-nums ${numbers[option.look]}`}>{option.day}</span>
              <span className={`text-micro font-semibold ${words[look]}`}>{option.word}</span>
              {option.dot ? <span aria-hidden className="absolute top-1 right-1 size-2.5 rounded-pill border-2 border-background bg-o500" /> : null}
            </button>
          )
        })}
      </div>
      <span className="text-micro text-muted">{caption}</span>
    </div>
  )
}
