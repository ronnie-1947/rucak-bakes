import { type ButtonSize, type ButtonVariant, buttonClasses } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"

type CallLinkProps = {
  /** E.164 — the tel: target. */
  phone: string
  /** "Call +91 98765 43210", or just "Call". */
  label: string
  /** The accessible name when the label alone says too little ("Call" beside a sentence). */
  ariaLabel?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/** A tel: link drawn as a button, with the phone glyph — the customer screens' one way to reach the bakery. */
export function CallLink({ phone, label, ariaLabel, variant = "outlineAccent", size = "md", className }: CallLinkProps) {
  return (
    <a
      href={`tel:${phone}`}
      aria-label={ariaLabel}
      className={buttonClasses(variant, size, `font-semibold whitespace-nowrap tabular-nums ${className ?? ""}`)}
    >
      <Icon name="phone" className="size-4.5 shrink-0" />
      {label}
    </a>
  )
}
