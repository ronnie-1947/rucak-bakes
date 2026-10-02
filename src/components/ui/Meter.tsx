type Tone = "warm" | "full" | "green"

type MeterProps = {
  value: number
  max: number
  tone?: Tone
  /** Accessible name — "Today 6 of 10 verified". */
  label: string
  className?: string
}

const fills: Record<Tone, string> = {
  warm: "fill-o500",
  full: "fill-red",
  green: "fill-green",
}

/**
 * A 4px capacity bar. Drawn as SVG so the fill width is an attribute, not an inline style.
 * Clamps at full — "11 of 10" draws a full bar; the number beside it says the rest.
 */
export function Meter({ value, max, tone = "warm", label, className }: MeterProps) {
  const width = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <svg
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      viewBox="0 0 100 4"
      preserveAspectRatio="none"
      className={`h-1 w-full overflow-hidden rounded-pill ${className ?? ""}`}
    >
      <rect width="100" height="4" className="fill-border" />
      <rect width={width} height="4" className={fills[tone]} />
    </svg>
  )
}
