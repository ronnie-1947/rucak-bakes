import type { ButtonHTMLAttributes, ReactNode } from "react"

export type ChipTone = "plain" | "warm" | "red" | "ink"
export type ChipSize = "admin" | "small" | "customer"
export type ChipShape = "chip" | "pill"

type ChipLook = { tone?: ChipTone; size?: ChipSize; shape?: ChipShape }

type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> &
  ChipLook & {
    children: ReactNode
    selected: boolean
    className?: string
  }

/**
 * Unselected, by tone: `plain` a filter · `warm` a choice that's on offer · `red` one that's on the menu but can't be
 * had — sold out, booked, closed · `ink` a customer filter that goes dark when chosen (the menu's categories).
 */
const tones: Record<ChipTone, string> = {
  plain: "border-border-strong bg-background font-medium text-foreground hover:bg-sunken",
  warm: "border-o200 bg-o50 font-medium text-foreground",
  red: "border-red-soft bg-red-soft font-medium text-red",
  ink: "border-border-strong bg-background font-semibold text-foreground hover:bg-sunken",
}

/** Selected is the large warm fill (o500) with INK text — o500 is never under white text. A red choice keeps its red, with a border. */
const selectedTones: Record<ChipTone, string> = {
  plain: "border-o500 bg-o500 font-semibold text-foreground",
  warm: "border-o500 bg-o500 font-semibold text-foreground",
  red: "border-red bg-red-soft font-semibold text-red",
  ink: "border-foreground bg-foreground font-semibold text-background",
}

/** 8px corners, or a pill (the customer menu's category filter). */
const shapes: Record<ChipShape, string> = {
  chip: "rounded-chip px-3",
  pill: "rounded-pill px-4",
}

/** Admin's 13px, the customer's 14px small (the menu's category filter), or the customer's 16px body. */
const sizes: Record<ChipSize, string> = {
  admin: "text-small-admin",
  small: "text-small",
  customer: "text-body",
}

/** A disabled chip (a day without the item) reads as absent whatever its tone. */
const disabled = "disabled:cursor-not-allowed disabled:border-border disabled:bg-background disabled:font-normal disabled:text-muted"

/** A filter or choice chip: 44px tall, 8px radius. */
export function chipClasses(selected: boolean, className?: string, { tone = "plain", size = "admin", shape = "chip" }: ChipLook = {}) {
  const state = selected ? selectedTones[tone] : tones[tone]
  return `inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border whitespace-nowrap transition-opacity duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${disabled} ${shapes[shape]} ${sizes[size]} ${state} ${className ?? ""}`
}

export function Chip({ children, selected, tone, size, shape, className, type = "button", ...rest }: ChipProps) {
  return (
    <button type={type} aria-pressed={selected} className={chipClasses(selected, className, { tone, size, shape })} {...rest}>
      {children}
    </button>
  )
}
