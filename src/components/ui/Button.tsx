import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "ink" | "ghost"
type Size = "sm" | "md" | "lg"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: Variant
  size?: Size
  className?: string
}

const base =
  "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

/**
 * orange-700 (#C2410C) is the runbook's "anything tapped or read" colour — 5.2:1 with white text.
 * Never use orange-500 as a fill under white text (2.8:1).
 */
const variants: Record<Variant, string> = {
  primary: "bg-orange-700 text-white hover:bg-orange-700/90 focus-visible:ring-orange-700",
  ink: "bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground",
  ghost: "bg-transparent text-foreground hover:bg-foreground/5 focus-visible:ring-foreground",
}

/** Every size clears a 44px touch target at the smallest breakpoint. */
const sizes: Record<Size, string> = {
  sm: "min-h-11 px-3 text-sm",
  md: "min-h-11 px-4 text-base sm:text-sm",
  lg: "min-h-12 px-6 text-base sm:px-8",
}

export function Button({ children, variant = "primary", size = "md", className, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  )
}
