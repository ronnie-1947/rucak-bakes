type Size = "sm" | "lg"

type SpinnerProps = {
  size?: Size
  className?: string
}

const sizes: Record<Size, string> = {
  sm: "size-5 border-2",
  lg: "size-8 border-3",
}

/** Decorative — pair it with visible text ("Opening Google…") or a role="status" parent. */
export function Spinner({ size = "sm", className }: SpinnerProps) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 animate-spin rounded-pill border-border border-t-o700 motion-reduce:animate-none ${sizes[size]} ${className ?? ""}`}
    />
  )
}
