import type { SelectHTMLAttributes } from "react"
import { Icon } from "@/components/ui/icons/Icon"

type Size = "md" | "sm" | "lg"
type Tone = "plain" | "active"

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "size"> & {
  options: { value: string; label: string }[]
  /** `sm` for narrow cards: admin small text from 768px. `lg` is 48px with customer text, beside a customer's 48px button. */
  size?: Size
  /** `active`: the choice differs from the default — a filter that's narrowing the list (the orders queue's Date / Status / Show). */
  tone?: Tone
  className?: string
}

const texts: Record<Size, string> = {
  md: "h-11 rounded-field md:text-body-admin",
  sm: "h-11 rounded-field md:text-small-admin",
  lg: "h-12 rounded-button",
}

/** The chevron, centred in the frame. */
const chevrons: Record<Size, string> = {
  md: "top-3.5",
  sm: "top-3.5",
  lg: "top-4",
}

/** Active is the large warm fill's border on the o50 tint, semibold — the same signal a selected filter chip gives. */
const tones: Record<Tone, string> = {
  plain: "border-border bg-background",
  active: "border-o500 bg-o50 font-semibold",
}

/**
 * A native select — the phone's own picker — in the text-field look, with a chevron. 16px text on phones so
 * iOS doesn't zoom on focus. `className` sizes the wrapper (its width); the select fills it.
 */
export function SelectField({ options, size = "md", tone = "plain", className, ...select }: SelectFieldProps) {
  return (
    <span className={`relative block min-w-0 ${className ?? ""}`}>
      <select
        className={`w-full cursor-pointer appearance-none truncate border pr-8 pl-3 text-body text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 disabled:cursor-default disabled:opacity-50 ${tones[tone]} ${texts[size]}`}
        {...select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" className={`pointer-events-none absolute right-3 size-4 text-muted ${chevrons[size]}`} />
    </span>
  )
}
