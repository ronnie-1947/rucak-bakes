"use client"

import { type KeyboardEvent, type ReactNode, useRef, useState } from "react"

type DayTabsProps = {
  /** Accessible name of the tab list. */
  label: string
  /** "Baking today", "Tomorrow" — one per panel, same order. */
  tabs: string[]
  /** Rendered on the server; the hidden one stays in the DOM. */
  panels: ReactNode[]
  initial: number
}

const looks: Record<"on" | "off", string> = {
  on: "border-o500 bg-o500 text-foreground",
  off: "border-border bg-background text-muted hover:bg-sunken",
}

/**
 * The Today / Tomorrow switch: 44px pills in Fraunces, the selected one the warm o500 fill with ink text. A
 * proper tablist — arrow keys move between tabs. Client only for which panel shows.
 */
export function DayTabs({ label, tabs, panels, initial }: DayTabsProps) {
  const [selected, setSelected] = useState(initial)
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (selected + step + tabs.length) % tabs.length
    setSelected(next)
    refs.current[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label={label} className="flex gap-2" onKeyDown={onKeyDown}>
        {tabs.map((tab, index) => (
          <button
            key={tab}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="tab"
            id={`day-tab-${index}`}
            aria-selected={index === selected}
            aria-controls={`day-panel-${index}`}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => setSelected(index)}
            className={`min-h-11 shrink-0 rounded-pill border px-4 font-display text-h2 font-semibold transition-opacity duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${looks[index === selected ? "on" : "off"]}`}
          >
            {tab}
          </button>
        ))}
      </div>
      {panels.map((panel, index) => (
        <div key={tabs[index]} role="tabpanel" id={`day-panel-${index}`} aria-labelledby={`day-tab-${index}`} hidden={index !== selected}>
          {panel}
        </div>
      ))}
    </div>
  )
}
