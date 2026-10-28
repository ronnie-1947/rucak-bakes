type Tone = "neutral" | "warm"

type SkeletonProps = {
  /** `warm` stands in for an o500 fill (the cart's day card). */
  tone?: Tone
  /** Size and radius — "h-4 w-1/2 rounded-chip". */
  className?: string
}

const tones: Record<Tone, string> = {
  neutral: "bg-border",
  warm: "bg-o200",
}

/** A pulsing placeholder while data loads. Decorative — put it under a role="status" parent with sr-only text. */
export function Skeleton({ tone = "neutral", className }: SkeletonProps) {
  return <span aria-hidden className={`block animate-pulse motion-reduce:animate-none ${tones[tone]} ${className ?? ""}`} />
}
