import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "ink" | "ghost"
type Size = "sm" | "md" | "lg"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: Variant
  size?: Size
  className?: string
}

/** No colour transition — the design system animates transform and opacity only. */
const base =
  "inline-flex items-center justify-center gap-2 rounded-button font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

/**
 * o700 (#C2410C) is the runbook's "anything tapped or read" colour — 5.2:1 with white text.
 * Never use o500 as a fill under white text (2.8:1).
 */
const variants: Record<Variant, string> = {
  primary: "bg-o700 text-background hover:bg-o700/90 focus-visible:ring-o700",
  ink: "bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground",
  ghost: "bg-transparent text-foreground hover:bg-sunken focus-visible:ring-foreground",
}

/** Every size clears a 44px touch target. Customer primary CTAs use `lg` (48px). */
const sizes: Record<Size, string> = {
  sm: "min-h-11 px-3 text-small",
  md: "min-h-11 px-4 text-body sm:text-small",
  lg: "min-h-12 px-6 text-body sm:px-8",
}

export function Button({ children, variant = "primary", size = "md", className, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  )
}
