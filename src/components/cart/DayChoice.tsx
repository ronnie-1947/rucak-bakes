type Look = "current" | "open" | "off"
type SideTone = "accent" | "green" | "red" | "muted"

type DayChoiceProps = {
  /** "Tomorrow, 5 Oct". */
  title: string
  /** "Order by Thursday 6pm", or why it can't be picked — "Too soon for Custom birthday cake". */
  sub: string
  /** "Current day", "3 orders left", "Open", "Fully booked". */
  side: string
  sideTone: SideTone
  /** current: the cart's day · open: takes every line · off: can't (disabled). */
  look: Look
  onPick: () => void
}

const frames: Record<Look, string> = {
  current: "border-o500 bg-o50",
  open: "border-border bg-background hover:bg-sunken",
  off: "cursor-not-allowed border-border bg-sunken",
}

const titles: Record<Look, string> = {
  current: "text-foreground",
  open: "text-foreground",
  off: "text-muted",
}

const sides: Record<SideTone, string> = {
  accent: "text-o700",
  green: "text-green",
  red: "text-red",
  muted: "text-muted",
}

/** One day in the Change day list. The side note is always words, never colour alone. */
export function DayChoice({ title, sub, side, sideTone, look, onPick }: DayChoiceProps) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={look === "off"}
      aria-current={look === "current" || undefined}
      className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-button border px-4 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${frames[look]}`}
    >
      <span className="flex min-w-0 flex-col">
        <span className={`font-semibold ${titles[look]}`}>{title}</span>
        <span className="text-small text-pretty text-muted">{sub}</span>
      </span>
      <span className={`shrink-0 text-small font-semibold tabular-nums ${sides[sideTone]}`}>{side}</span>
    </button>
  )
}
