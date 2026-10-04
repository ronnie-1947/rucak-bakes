import { Icon } from "@/components/ui/icons/Icon"

type Width = "auto" | "full"
type Size = "md" | "lg"

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
  /** How far one press moves the value — 10 for a fee in rupees. */
  step?: number
  /** The value as shown — "₹40", "3 km". The bare number when omitted; screen readers get it as aria-valuetext. */
  display?: string
  /** `md` 44px · `lg` 48px, beside a customer's 48px primary button (the item page's Add to cart). */
  size?: Size
}

const button =
  "grid size-11 shrink-0 place-items-center rounded-field text-foreground hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700 disabled:opacity-40"

/** The border, by size — `lg` takes the stronger one, as the 48px outline button beside it does. */
const frames: Record<Size, Record<"invalid" | "valid", string>> = {
  md: { invalid: "border-red", valid: "border-border" },
  lg: { invalid: "border-red", valid: "border-border-strong" },
}

/** The frame's height and corners; `lg` matches the 48px button beside it (12px corners). */
const sizes: Record<Size, string> = {
  md: "h-11 rounded-field",
  lg: "h-12 rounded-button",
}

const widths: Record<Width, string> = {
  auto: "self-start",
  full: "w-full",
}

/** The value's width; `lg` sits beside a button that needs the room, and only ever shows one or two digits. */
const values: Record<Size, Record<Width, string>> = {
  md: { auto: "min-w-14", full: "min-w-6 flex-1" },
  lg: { auto: "min-w-8", full: "min-w-6 flex-1" },
}

/** − value + in one bordered pill. Each button is a 44px target; the value is a spinbutton for screen readers. */
export function Stepper({
  id,
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
  describedBy,
  invalid = false,
  width = "auto",
  step = 1,
  display,
  size = "md",
}: StepperProps) {
  const down = () => onChange(Math.max(min, value - step))
  const up = () => onChange(Math.min(max, value + step))
  return (
    <div className={`flex items-center border bg-background ${sizes[size]} ${frames[size][invalid ? "invalid" : "valid"]} ${widths[width]}`}>
      <button type="button" aria-label={decreaseLabel} disabled={value <= min} onClick={down} className={button}>
        <Icon name="minus" className="size-4" />
      </button>
      <span
        id={id}
        role="spinbutton"
        tabIndex={0}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={display}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp" || event.key === "ArrowRight") up()
          else if (event.key === "ArrowDown" || event.key === "ArrowLeft") down()
          else return
          event.preventDefault()
        }}
        className={`rounded-chip text-center font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-o700 ${values[size][width]}`}
      >
        {display ?? value}
      </span>
      <button type="button" aria-label={increaseLabel} disabled={value >= max} onClick={up} className={button}>
        <Icon name="plus" className="size-4" />
      </button>
    </div>
  )
}
