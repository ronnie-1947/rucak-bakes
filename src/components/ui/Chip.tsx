import type { ButtonHTMLAttributes, ReactNode } from "react"

export type ChipTone = "plain" | "warm" | "red"
export type ChipSize = "admin" | "customer"

type ChipLook = { tone?: ChipTone; size?: ChipSize }

type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> &
  ChipLook & {
    children: ReactNode
    selected: boolean
    className?: string
  }

/**
 * Unselected, by tone: `plain` a filter · `warm` a choice that's on offer (the item page's pickup days) · `red`
 * one that's on the menu but can't be had — sold out, booked, closed.
 */
const tones: Record<ChipTone, string> = {
  plain: "border-border-strong bg-background font-medium text-foreground hover:bg-sunken",
  warm: "border-o200 bg-o50 font-medium text-foreground",
  red: "border-red-soft bg-red-soft font-medium text-red",
}

/** Selected is the large warm fill (o500) with INK text — o500 is never under white text. A red choice keeps its red, with a border. */
const selectedTones: Record<ChipTone, string> = {
  plain: "border-o500 bg-o500 font-semibold text-foreground",
  warm: "border-o500 bg-o500 font-semibold text-foreground",
  red: "border-red bg-red-soft font-semibold text-red",
}

/** Admin's 13px, or the customer's 16px body. */
const sizes: Record<ChipSize, string> = {
  admin: "text-small-admin",
  customer: "text-body",
}

/** A disabled chip (a day without the item) reads as absent whatever its tone. */
const disabled = "disabled:cursor-not-allowed disabled:border-border disabled:bg-background disabled:font-normal disabled:text-muted"

/** A filter or choice chip: 44px tall, 8px radius. */
export function chipClasses(selected: boolean, className?: string, { tone = "plain", size = "admin" }: ChipLook = {}) {
  const state = selected ? selectedTones[tone] : tones[tone]
  return `inline-flex min-h-11 shrink-0 items-center justify-center rounded-chip border px-3 whitespace-nowrap transition-opacity duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${disabled} ${sizes[size]} ${state} ${className ?? ""}`
}

export function Chip({ children, selected, tone, size, className, type = "button", ...rest }: ChipProps) {
  return (
    <button type={type} aria-pressed={selected} className={chipClasses(selected, className, { tone, size })} {...rest}>
      {children}
    </button>
  )
}
