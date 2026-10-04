"use client"

import { type ReactNode, useState } from "react"
import { Chip } from "@/components/ui/Chip"

type CategoryFilterProps = {
  /** "Filter by category" */
  label: string
  /** All first, then each category with an item. */
  filters: { key: string; label: string; count: number }[]
  /** The cards, rendered on the server, each with its filter key. */
  cards: { id: string; key: string; card: ReactNode }[]
}

/**
 * The category chips and the grid they filter — client state only, no URL: a quick narrowing, not a place to link to.
 * 44px pills, dark when chosen (`aria-pressed`), each with its count. 2 / 3 / 4 columns.
 */
export function CategoryFilter({ label, filters, cards }: CategoryFilterProps) {
  const all = filters[0]?.key
  const [current, setCurrent] = useState(all)
  const shown = cards.filter((entry) => current === all || entry.key === current)

  return (
    <>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Chip key={filter.key} selected={filter.key === current} onClick={() => setCurrent(filter.key)} tone="ink" size="small" shape="pill">
            {filter.label}
            <span className="font-medium tabular-nums opacity-70">{filter.count}</span>
          </Chip>
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {shown.map((entry) => (
          <li key={entry.id} className="flex min-w-0">
            {entry.card}
          </li>
        ))}
      </ul>
    </>
  )
}
