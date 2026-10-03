type SwitchProps = {
  checked: boolean
  onChange: () => void
  /** The visible state word beside the track — "Active" / "Inactive". Never colour alone. */
  stateLabel: string
  /** The accessible name — what is being switched ("Sourdough loaf on sale"). */
  label: string
  disabled?: boolean
  /** `danger`: a red track while on — Blocked. */
  tone?: Tone
  className?: string
}

type Tone = "warm" | "danger"

const tracks: Record<Tone, Record<"on" | "off", string>> = {
  warm: { on: "bg-o500", off: "bg-border-strong" },
  danger: { on: "bg-red", off: "bg-border-strong" },
}

const knobs: Record<"on" | "off", string> = {
  on: "translate-x-3.5",
  off: "translate-x-0",
}

const words: Record<Tone, Record<"on" | "off", string>> = {
  warm: { on: "text-green", off: "text-muted" },
  danger: { on: "text-red", off: "text-muted" },
}

/**
 * An on/off switch with its state written beside it. The track is the large warm fill (o500) with no
 * text on it; the 44px-tall button is the tap target. The knob slides on transform only, 150ms.
 */
export function Switch({ checked, onChange, stateLabel, label, disabled, tone = "warm", className }: SwitchProps) {
  const state = checked ? "on" : "off"
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`flex min-h-11 items-center gap-2 rounded-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 disabled:opacity-50 ${className ?? ""}`}
    >
      <span aria-hidden className={`relative h-5.5 w-9 shrink-0 rounded-pill ${tracks[tone][state]}`}>
        <span
          className={`absolute top-0.5 left-0.5 size-4.5 rounded-pill bg-background shadow-raised transition-transform duration-150 ease-out motion-reduce:transition-none ${knobs[state]}`}
        />
      </span>
      <span aria-hidden className={`text-small-admin font-semibold ${words[tone][state]}`}>
        {stateLabel}
      </span>
    </button>
  )
}
