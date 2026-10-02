import type { InputHTMLAttributes } from "react"

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
  className?: string
}

const borders: Record<"invalid" | "valid", string> = {
  invalid: "border-red",
  valid: "border-border",
}

/**
 * The look of a text field — shared by inputs, textareas and the bordered shells around prefixed inputs.
 * 16px text on phones so iOS doesn't zoom on focus; admin body size from 768px.
 */
export function inputClasses(invalid = false, className?: string) {
  return `min-h-11 w-full rounded-field border bg-background px-3 text-body text-foreground placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 md:text-body-admin ${borders[invalid ? "invalid" : "valid"]} ${className ?? ""}`
}

export function TextInput({ invalid = false, className, type = "text", ...rest }: TextInputProps) {
  return <input type={type} aria-invalid={invalid || undefined} className={inputClasses(invalid, className)} {...rest} />
}
