import type { ButtonHTMLAttributes, ReactNode } from "react"

type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  children: ReactNode
  selected: boolean
  className?: string
}

/**
 * A filter or choice chip. Selected is the large warm fill (o500) with INK text — o500 is never under
 * white text. 44px tall, 8px radius.
 */
export function chipClasses(selected: boolean, className?: string) {
  const state = selected ? "border-o500 bg-o500 font-semibold" : "border-border-strong bg-background font-medium hover:bg-sunken"
  return `inline-flex min-h-11 shrink-0 items-center justify-center rounded-chip border px-3 text-small-admin whitespace-nowrap text-foreground transition-opacity duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${state} ${className ?? ""}`
}

export function Chip({ children, selected, className, type = "button", ...rest }: ChipProps) {
  return (
    <button type={type} aria-pressed={selected} className={chipClasses(selected, className)} {...rest}>
      {children}
    </button>
  )
}
