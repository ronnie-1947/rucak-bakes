import type { InputHTMLAttributes } from "react"

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
  className?: string
}

/** `accent`: the value changes something the customer sees — a price override. */
export type InputFrame = "valid" | "invalid" | "accent"

const frames: Record<InputFrame, string> = {
  invalid: "border-red",
  valid: "border-border",
  accent: "border-o500",
}

/** 16px text on phones so iOS doesn't zoom on focus; admin body size from 768px. */
const look = "min-h-11 w-full rounded-field border bg-background text-body text-foreground md:text-body-admin"

/** The look of a text field — shared by inputs and textareas. */
export function inputClasses(invalid = false, className?: string) {
  return `${look} px-3 placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${frames[invalid ? "invalid" : "valid"]} ${className ?? ""}`
}

/**
 * The bordered shell around a prefixed input ("₹", "/menu/"): the field look with no padding of its own,
 * outlined while the input inside has focus. The inner input is bare — `flex-1 bg-transparent px-3 outline-none`.
 */
export function inputShellClasses(frame: InputFrame = "valid", className?: string) {
  return `${look} flex items-stretch overflow-hidden focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-o700 ${frames[frame]} ${className ?? ""}`
}

export function TextInput({ invalid = false, className, type = "text", ...rest }: TextInputProps) {
  return <input type={type} aria-invalid={invalid || undefined} className={inputClasses(invalid, className)} {...rest} />
}
