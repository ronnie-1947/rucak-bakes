import type { ReactNode } from "react"
import { Stepper } from "@/components/ui/Stepper"

type StepperFieldProps = {
  id: string
  label: string
  /** The plain-language consequence — "You'll receive up to 15 requests and choose which 10 to verify." */
  hint: string
  error?: string
  value: number
  min: number
  max: number
  step?: number
  /** "7 days", "₹40" — the bare number when omitted. */
  display?: string
  onChange: (value: number) => void
  decreaseLabel: string
  increaseLabel: string
  /** A line under the hint — a link elsewhere. */
  children?: ReactNode
  className?: string
}

/** A labelled − value + with its consequence line under it (red when the value breaks a rule). */
export function StepperField({
  id,
  label,
  hint,
  error,
  value,
  min,
  max,
  step,
  display,
  onChange,
  decreaseLabel,
  increaseLabel,
  children,
  className,
}: StepperFieldProps) {
  return (
    <div role="group" aria-labelledby={`${id}-label`} className={`flex min-w-0 flex-col gap-2 ${className ?? ""}`}>
      <span id={`${id}-label`} className="text-small-admin text-muted">
        {label}
      </span>
      <Stepper
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        display={display}
        onChange={onChange}
        decreaseLabel={decreaseLabel}
        increaseLabel={increaseLabel}
        describedBy={`${id}-message`}
        invalid={Boolean(error)}
      />
      <span id={`${id}-message`} className={`text-small-admin text-pretty tabular-nums ${error ? "text-red" : "text-muted"}`}>
        {error ?? hint}
      </span>
      {children}
    </div>
  )
}
