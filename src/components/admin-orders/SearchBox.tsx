"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Icon } from "@/components/ui/icons/Icon"
import { type OrderFilters, filtersHref } from "@/lib/orders/filters"

type SearchBoxProps = {
  filters: OrderFilters
  label: string
  placeholder: string
}

/** Matches order code, name, or any 3+ digits of the phone. Updates the URL 300ms after typing stops. */
export function SearchBox({ filters, label, placeholder }: SearchBoxProps) {
  const router = useRouter()
  const [value, setValue] = useState(filters.q)
  const [seenQ, setSeenQ] = useState(filters.q)

  // "Clear filters" empties q in the URL — empty the box too. (Adjusting state on a prop change, not in an effect.)
  if (filters.q !== seenQ) {
    setSeenQ(filters.q)
    if (filters.q === "") setValue("")
  }

  useEffect(() => {
    if (value.trim() === filters.q) return
    const timer = setTimeout(() => router.replace(filtersHref({ ...filters, q: value.trim(), order: null }), { scroll: false }), 300)
    return () => clearTimeout(timer)
  }, [value, filters, router])

  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Icon name="search" className="pointer-events-none absolute top-3 left-3 size-5 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        enterKeyHint="search"
        className="h-11 w-full rounded-field border border-border bg-background pr-3 pl-10 text-body text-foreground placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 md:text-body-admin"
      />
    </label>
  )
}
