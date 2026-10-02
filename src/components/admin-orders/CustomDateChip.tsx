"use client"

import { useRouter } from "next/navigation"
import { chipClasses } from "@/components/ui/Chip"
import { isIsoDate } from "@/lib/dates"
import { type OrderFilters, datePresets, filtersHref } from "@/lib/orders/filters"

type CustomDateChipProps = {
  filters: OrderFilters
  label: string
}

/** A chip wrapping a native date input — the platform picker on phones, no custom calendar to maintain. */
export function CustomDateChip({ filters, label }: CustomDateChipProps) {
  const router = useRouter()
  const custom = filters.dates.find((date) => !(datePresets as readonly string[]).includes(date)) ?? ""

  return (
    <label className={chipClasses(Boolean(custom), "relative cursor-pointer gap-2")}>
      <span>{custom || label}</span>
      <input
        type="date"
        aria-label={label}
        value={custom}
        onChange={(event) => {
          const date = event.target.value
          if (!isIsoDate(date)) return
          router.push(filtersHref({ ...filters, dates: [date], order: null }), { scroll: false })
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  )
}
