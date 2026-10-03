"use client"

import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/icons/Icon"

type LinkSelectProps = {
  value: string
  /** Each choice with its label and the URL that applies it — built on the server. */
  options: { value: string; label: string; href: string }[]
  label: string
  className?: string
}

/**
 * A native select (the phone's own picker) whose choices are URLs — a sort kept in `?sort=`. Picking one
 * replaces the URL. 16px text on phones, so iOS doesn't zoom on focus.
 */
export function LinkSelect({ value, options, label, className }: LinkSelectProps) {
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
        className="h-11 cursor-pointer appearance-none rounded-field border border-border bg-background pr-8 pl-3 text-body text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 md:text-small-admin"
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
