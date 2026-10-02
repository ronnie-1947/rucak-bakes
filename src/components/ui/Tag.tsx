import type { ReactNode } from "react"

export type TagTone = "warm" | "green" | "red" | "neutral" | "quiet"

type TagProps = {
  children: ReactNode
  tone?: TagTone
  className?: string
}

const tones: Record<TagTone, string> = {
  warm: "border-o200 bg-o50 text-o700",
  green: "border-green-soft bg-green-soft text-green",
  red: "border-red-soft bg-red-soft text-red",
  neutral: "border-border bg-sunken text-foreground",
  quiet: "border-border bg-sunken text-muted",
}

/** A small labelled fact about a row — "Trusted", "Ordered before (4)". Always text, never colour alone. */
export function Tag({ children, tone = "neutral", className }: TagProps) {
  return (
    <span className={`inline-flex min-h-5 shrink-0 items-center rounded-chip border px-2 text-micro font-semibold whitespace-nowrap ${tones[tone]} ${className ?? ""}`}>
      {children}
    </span>
  )
}
