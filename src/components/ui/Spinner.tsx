type Size = "sm" | "lg"
type Tone = "accent" | "inverse"

type SpinnerProps = {
  size?: Size
  /** `inverse` on a filled o700 button ("Place order" while it sends). */
  tone?: Tone
  className?: string
}

const tones: Record<Tone, string> = {
  accent: "border-border border-t-o700",
  inverse: "border-background/40 border-t-background",
}

const sizes: Record<Size, string> = {
  sm: "size-5 border-2",
  lg: "size-8 border-3",
}

/** Decorative — pair it with visible text ("Opening Google…") or a role="status" parent. */
export function Spinner({ size = "sm", tone = "accent", className }: SpinnerProps) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 animate-spin rounded-pill motion-reduce:animate-none ${tones[tone]} ${sizes[size]} ${className ?? ""}`}
    />
  )
}
