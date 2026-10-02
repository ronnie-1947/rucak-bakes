import { Icon } from "@/components/ui/icons/Icon"

type Width = "auto" | "full"

type StepperProps = {
  id?: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  decreaseLabel: string
  increaseLabel: string
  /** aria-describedby for the value — the field's hint. */
  describedBy?: string
  /** The value breaks a rule (a quantity below what's ordered) — a red frame. The line saying why is the caller's. */
  invalid?: boolean
  /** `full` stretches across its column, the value centred between the buttons. */
  width?: Width
}

const button =
  "grid size-11 shrink-0 place-items-center rounded-field text-foreground hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700 disabled:opacity-40"

const frames: Record<"invalid" | "valid", string> = {
  invalid: "border-red",
  valid: "border-border",
}

const widths: Record<Width, string> = {
  auto: "self-start",
  full: "w-full",
}

const values: Record<Width, string> = {
  auto: "min-w-14",
  full: "min-w-6 flex-1",
}

/** − value + in one bordered pill. Each button is a 44px target; the value is a spinbutton for screen readers. */
export function Stepper({ id, value, min, max, onChange, decreaseLabel, increaseLabel, describedBy, invalid = false, width = "auto" }: StepperProps) {
  return (
    <div className={`flex h-11 items-center rounded-field border bg-background ${frames[invalid ? "invalid" : "valid"]} ${widths[width]}`}>
      <button type="button" aria-label={decreaseLabel} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} className={button}>
        <Icon name="minus" className="size-4" />
      </button>
      <span
        id={id}
        role="spinbutton"
        tabIndex={0}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp" || event.key === "ArrowRight") onChange(Math.min(max, value + 1))
          else if (event.key === "ArrowDown" || event.key === "ArrowLeft") onChange(Math.max(min, value - 1))
          else return
          event.preventDefault()
        }}
        className={`rounded-chip text-center font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-o700 ${values[width]}`}
      >
        {value}
      </span>
      <button type="button" aria-label={increaseLabel} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} className={button}>
        <Icon name="plus" className="size-4" />
      </button>
    </div>
  )
}
