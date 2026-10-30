import type { ButtonHTMLAttributes, ReactNode } from "react"

export type ChipTone = "plain" | "warm" | "red" | "ink" | "option"
export type ChipSize = "admin" | "small" | "customer" | "compact"
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
 * had — sold out, booked, closed · `ink` a customer filter that goes dark when chosen (the menu's categories) · `option`
 * a quiet choice inside a card that outlines in the accent when picked (a menu card's sizes).
 */
const tones: Record<ChipTone, string> = {
  plain: "border-border-strong bg-background font-medium text-foreground hover:bg-sunken",
  warm: "border-o200 bg-o50 font-medium text-foreground",
  red: "border-red-soft bg-red-soft font-medium text-red",
  ink: "border-border-strong bg-background font-semibold text-foreground hover:bg-sunken",
  option: "border-border bg-background font-medium text-foreground hover:border-border-strong hover:bg-sunken",
}

/** Selected is the large warm fill (o500) with INK text — o500 is never under white text. A red choice keeps its red, with a border. */
const selectedTones: Record<ChipTone, string> = {
  plain: "border-o500 bg-o500 font-semibold text-foreground",
  warm: "border-o500 bg-o500 font-semibold text-foreground",
  red: "border-red bg-red-soft font-semibold text-red",
  ink: "border-foreground bg-foreground font-semibold text-background",
  option: "border-o700 bg-o50 font-semibold text-o700",
}

/** 8px corners, or a pill (the customer menu's category filter). */
const shapes: Record<ChipShape, string> = {
  chip: "rounded-chip",
  pill: "rounded-pill",
}

/** Side padding — a pill is roomier; a compact chip tighter. */
const paddings: Record<ChipShape, Record<ChipSize, string>> = {
  chip: { admin: "px-3", small: "px-3", customer: "px-3", compact: "px-2" },
  pill: { admin: "px-4", small: "px-4", customer: "px-4", compact: "px-3" },
}

/**
 * Admin's 13px, the customer's 14px small (the menu's category filter), or the customer's 16px body — all 44px tall.
 * `compact` is 32px to the eye with a 40px tap height (an invisible layer 4px above and below — give its rows 4px of room
 * and 8px between them): many small choices in a narrow card, usually as grid cells.
 */
const sizes: Record<ChipSize, string> = {
  admin: "min-h-11 text-small-admin",
  small: "min-h-11 text-small",
  customer: "min-h-11 text-body",
  compact: "relative min-h-8 text-small before:absolute before:inset-x-0 before:-inset-y-1",
}

/** A disabled chip (a day without the item) reads as absent whatever its tone. */
const disabled = "disabled:cursor-not-allowed disabled:border-border disabled:bg-background disabled:font-normal disabled:text-muted"

/** A filter or choice chip: 44px tall (32px `compact`), 8px radius. */
export function chipClasses(selected: boolean, className?: string, { tone = "plain", size = "admin", shape = "chip" }: ChipLook = {}) {
  const state = selected ? selectedTones[tone] : tones[tone]
  return `inline-flex shrink-0 items-center justify-center gap-2 border whitespace-nowrap transition-opacity duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${disabled} ${shapes[shape]} ${paddings[shape][size]} ${sizes[size]} ${state} ${className ?? ""}`
}

export function Chip({ children, selected, tone, size, shape, className, type = "button", ...rest }: ChipProps) {
  return (
    <button type={type} aria-pressed={selected} className={chipClasses(selected, className, { tone, size, shape })} {...rest}>
      {children}
    </button>
  )
}
