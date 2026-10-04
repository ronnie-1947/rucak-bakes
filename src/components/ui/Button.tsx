import type { ButtonHTMLAttributes, ReactNode } from "react"

export type ButtonVariant = "primary" | "ink" | "ghost" | "outline" | "outlineLink" | "outlineAccent" | "danger" | "dangerOutline" | "link" | "underline" | "quiet"
export type ButtonSize = "sm" | "md" | "lg" | "block" | "inline"
export type ButtonShape = "rounded" | "pill"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  className?: string
}

/** No colour transition — the design system animates transform and opacity only. */
const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-transform duration-150 ease-out active:scale-99 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"

/**
 * o700 (#C2410C) is the runbook's "anything tapped or read" colour — 5.2:1 with white text.
 * Never use o500 as a fill under white text (2.8:1).
 */
const variants: Record<ButtonVariant, string> = {
  primary: "bg-o700 text-background hover:bg-o700/90",
  ink: "bg-foreground text-background hover:bg-foreground/90",
  ghost: "bg-transparent text-foreground hover:bg-sunken",
  /** Neutral secondary — the Google sign-in button, Cancel in a dialog. */
  outline: "border border-border-strong bg-background text-foreground hover:bg-sunken",
  /** Neutral border, accent text — Call and WhatsApp beside a primary action. */
  outlineLink: "border border-border-strong bg-background font-semibold text-o700 hover:bg-o50",
  /** The recovery action next to an error — "Try again", "Try a different account". */
  outlineAccent: "border border-o700 bg-background font-semibold text-o700 hover:bg-o50",
  /** The confirm button of a destructive dialog. */
  danger: "bg-red font-semibold text-background hover:bg-red/90",
  dangerOutline: "border border-red bg-background font-semibold text-red hover:bg-red-soft",
  link: "bg-transparent font-semibold text-o700 hover:underline",
  /** Ink and always underlined — a link-like action on a warm o500 fill, where o700 text would not read ("Change day"). */
  underline: "bg-transparent font-semibold text-foreground underline underline-offset-3 hover:decoration-2",
  /** Muted until hovered, then red — a small take-away action on a row ("Remove"). */
  quiet: "bg-transparent text-muted hover:text-red",
}

/**
 * Every size clears a 44px touch target. Customer primary CTAs use `lg` (48px). `block` is a 48px button whose
 * width comes from its row (flex-1 beside a stepper), so it keeps only a little padding for its label. `inline`
 * drops the padding for link-styled buttons.
 */
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 text-small",
  md: "min-h-11 px-4 text-body sm:text-small",
  lg: "min-h-12 px-6 text-body sm:px-8",
  block: "min-h-12 px-3 text-body",
  inline: "min-h-11 px-0 text-small",
}

/** 12px corners everywhere; `pill` is the customer's floating View cart, which sits over the page with a shadow. */
const shapes: Record<ButtonShape, string> = {
  rounded: "rounded-button",
  pill: "rounded-pill shadow-raised",
}

/** The class string for a button look — shared with ButtonLink so a link and a button can never drift apart. */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string, shape: ButtonShape = "rounded") {
  return `${base} ${shapes[shape]} ${variants[variant]} ${sizes[size]} ${className ?? ""}`
}

export function Button({ children, variant = "primary", size = "md", shape = "rounded", className, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className, shape)} {...rest}>
      {children}
    </button>
  )
}
