"use client"

import { useRouter } from "next/navigation"
import { useId } from "react"
import { SelectField } from "@/components/ui/SelectField"

/** One choice: where picking it goes (built on the server), or null for one the caller handles — "Custom date…". */
export type FilterOption = { value: string; label: string; href: string | null }

type FilterSelectProps = {
  /** "Date", "Status", "Show" — the micro label above. */
  label: string
  value: string
  options: FilterOption[]
  /** The choice differs from the default, so it's narrowing the list — drawn highlighted. */
  active: boolean
  /** Picked an option without an href. */
  onPick?: (value: string) => void
  className?: string
}

/** A labelled native select whose choices are filter URLs — the phone's own picker. Picking one replaces the URL. */
export function FilterSelect({ label, value, options, active, onPick, className }: FilterSelectProps) {
  const router = useRouter()
  const id = useId()
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className ?? ""}`}>
      <label htmlFor={id} className="text-micro font-semibold text-muted uppercase">
        {label}
      </label>
      <SelectField
        id={id}
        value={value}
        size="sm"
        tone={active ? "active" : "plain"}
        options={options.map((option) => ({ value: option.value, label: option.label }))}
        onChange={(event) => {
          const option = options.find((candidate) => candidate.value === event.target.value)
          if (!option) return
          if (option.href) router.replace(option.href, { scroll: false })
          else onPick?.(option.value)
        }}
      />
    </div>
  )
}
