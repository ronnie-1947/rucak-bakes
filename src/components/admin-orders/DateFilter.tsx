"use client"

import { useRouter } from "next/navigation"
import { useRef } from "react"
import { formatDayLabel, isIsoDate } from "@/lib/dates"
import { datePresets, filtersHref, type OrderFilters } from "@/lib/orders/filters"
import { type FilterOption, FilterSelect } from "./FilterSelect"
import type { OrdersCopy } from "./types"

type DateFilterProps = {
  filters: OrderFilters
  dict: OrdersCopy["filters"]
  className?: string
}

/** The option that opens the date picker instead of going anywhere. */
const CUSTOM = "custom"

/**
 * Date: Upcoming (the default) · Today · Tomorrow · This week · Custom date… — the last opens the platform's date picker
 * on a hidden input, no custom calendar to maintain. A picked date joins the list as its own option ("Sat 10 Oct").
 */
export function DateFilter({ filters, dict, className }: DateFilterProps) {
  const router = useRouter()
  const picker = useRef<HTMLInputElement>(null)
  const base = { ...filters, order: null }
  const custom = filters.dates.find((date) => !(datePresets as readonly string[]).includes(date)) ?? null
  const options: FilterOption[] = [
    ...datePresets.map((preset) => ({ value: preset, label: dict.dates[preset], href: filtersHref({ ...base, dates: [preset] }) })),
    ...(custom ? [{ value: custom, label: formatDayLabel(custom), href: null }] : []),
    { value: CUSTOM, label: dict.customDate, href: null },
  ]

  const openPicker = () => {
    const input = picker.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
      input.click()
    }
  }

  return (
    <div className={`relative min-w-0 ${className ?? ""}`}>
      <FilterSelect
        label={dict.date}
        value={custom ?? filters.dates[0] ?? "upcoming"}
        options={options}
        active={filters.dates.length !== 1 || filters.dates[0] !== "upcoming"}
        onPick={(value) => {
          if (value === CUSTOM) openPicker()
        }}
      />
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={custom ?? ""}
        onChange={(event) => {
          const date = event.target.value
          if (isIsoDate(date)) router.replace(filtersHref({ ...base, dates: [date] }), { scroll: false })
        }}
        className="pointer-events-none absolute bottom-0 left-0 size-px opacity-0"
      />
    </div>
  )
}
