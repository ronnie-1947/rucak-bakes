type ProgressRingProps = {
  /** 0–1 */
  progress: number
  /** "Uploading, 62%" */
  label: string
  size: "md" | "lg"
}

const sizes: Record<"md" | "lg", string> = {
  md: "size-10",
  lg: "size-14",
}

const CIRCUMFERENCE = 2 * Math.PI * 16

/** An upload's progress — a white disc with the warm arc filling clockwise from the top. */
export function ProgressRing({ progress, label, size }: ProgressRingProps) {
  const filled = Math.max(0, Math.min(1, progress)) * CIRCUMFERENCE
  return (
    <svg
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      viewBox="0 0 40 40"
      className={sizes[size]}
    >
      <circle cx="20" cy="20" r="16" strokeWidth="4" className="fill-background stroke-border" />
      <circle
        cx="20"
        cy="20"
        r="16"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
        transform="rotate(-90 20 20)"
        className="fill-none stroke-o500"
      />
    </svg>
  )
}
