import type { ReactNode } from "react"

export type TagTone = "warm" | "accent" | "green" | "red" | "neutral" | "quiet" | "plain"
export type TagSize = "sm" | "pill" | "md"

type TagProps = {
  children: ReactNode
  tone?: TagTone
  /** `sm` a row's fact · `pill` a status that heads a block (the landing page's "Available") · `md` a listed value (an ingredient). */
  size?: TagSize
  className?: string
}

const tones: Record<TagTone, string> = {
  warm: "border-o200 bg-o50 text-o700",
  /** The large warm fill with ink text — a fact that changes what a customer pays ("Override ₹260"). */
  accent: "border-o500 bg-o500 text-foreground",
  green: "border-green-soft bg-green-soft text-green",
  red: "border-red-soft bg-red-soft text-red",
  neutral: "border-border bg-sunken text-foreground",
  quiet: "border-border bg-sunken text-muted",
  /** White with a border — a fact laid over a photo (a menu card's "Order by tomorrow"). */
  plain: "border-border bg-background text-foreground",
}

/** `md` is regular weight and wraps — an ingredient can be longer than a 320px screen. Bold it with `className` (allergens). */
const sizes: Record<TagSize, string> = {
  sm: "min-h-5 rounded-chip px-2 text-micro font-semibold whitespace-nowrap",
  pill: "min-h-7 rounded-pill px-3 text-small font-semibold whitespace-nowrap",
  md: "min-h-8 max-w-full rounded-chip px-3 py-1 text-small",
}

/** A small labelled fact about a row — "Trusted", "Ordered before (4)". Always text, never colour alone. */
export function Tag({ children, tone = "neutral", size = "sm", className }: TagProps) {
  return (
    <span className={`inline-flex shrink-0 items-center border ${sizes[size]} ${tones[tone]} ${className ?? ""}`}>
      {children}
    </span>
  )
}
