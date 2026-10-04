type Look = "current" | "open" | "off"

type DayChoiceProps = {
  /** "Tomorrow, 5 Oct". */
  title: string
  /** "Order by 6pm today" — null when the day has no cutoff to show. */
  sub: string | null
  /** "Current day", "7 of 15 left", "Fully booked". */
  side: string
  /** current: the cart's day · open: takes orders · off: can't (disabled). */
  look: Look
  onPick: () => void
}

const frames: Record<Look, string> = {
  current: "border-o500 bg-o50",
  open: "border-border bg-background hover:bg-sunken",
  off: "cursor-not-allowed border-border bg-background",
}

const titles: Record<Look, string> = {
  current: "text-foreground",
  open: "text-foreground",
  off: "text-muted",
}

const sides: Record<Look, string> = {
  current: "text-o700",
  open: "text-green",
  off: "text-red",
}

/** One day in the Change day list. The side note is always words, never colour alone. */
export function DayChoice({ title, sub, side, look, onPick }: DayChoiceProps) {
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
        {sub ? <span className="text-small text-muted">{sub}</span> : null}
      </span>
      <span className={`shrink-0 text-small font-semibold tabular-nums ${sides[look]}`}>{side}</span>
    </button>
  )
}
