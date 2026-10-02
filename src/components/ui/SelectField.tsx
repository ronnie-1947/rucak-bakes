import type { SelectHTMLAttributes } from "react"
import { Icon } from "@/components/ui/icons/Icon"

type Size = "md" | "sm"

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "size"> & {
  options: { value: string; label: string }[]
  /** `sm` for narrow cards: admin small text from 768px. */
  size?: Size
  className?: string
}

const texts: Record<Size, string> = {
  md: "md:text-body-admin",
  sm: "md:text-small-admin",
}

/**
 * A native select — the phone's own picker — in the text-field look, with a chevron. 16px text on phones so
 * iOS doesn't zoom on focus. `className` sizes the wrapper (its width); the select fills it.
 */
export function SelectField({ options, size = "md", className, ...select }: SelectFieldProps) {
  return (
    <span className={`relative block min-w-0 ${className ?? ""}`}>
      <select
        className={`h-11 w-full cursor-pointer appearance-none truncate rounded-field border border-border bg-background pr-8 pl-3 text-body text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 disabled:cursor-default disabled:opacity-50 ${texts[size]}`}
        {...select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute top-3.5 right-3 size-4 text-muted" />
    </span>
  )
}
