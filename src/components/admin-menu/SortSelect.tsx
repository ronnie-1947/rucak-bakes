"use client"

import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/icons/Icon"
import type { SortChoice } from "@/lib/menu/filters"

type SortSelectProps = {
  value: SortChoice
  /** Each choice with its label and the URL that applies it — built on the server. */
  options: { value: SortChoice; label: string; href: string }[]
  label: string
  className?: string
}

/** A native select (the phone's own picker) that swaps ?sort= in the URL. 16px text on phones, so iOS doesn't zoom on focus. */
export function SortSelect({ value, options, label, className }: SortSelectProps) {
  const router = useRouter()
  return (
    <label className={`relative shrink-0 ${className ?? ""}`}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => {
          const next = options.find((option) => option.value === event.target.value)
          if (next) router.replace(next.href, { scroll: false })
        }}
        className="h-11 cursor-pointer appearance-none rounded-field border border-border bg-background pr-8 pl-3 text-body text-foreground md:text-small-admin focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute top-4 right-3 size-3.5 text-muted" />
    </label>
  )
}
