import type { InputHTMLAttributes, ReactNode } from "react"
import { CheckIcon } from "@/components/ui/icons/CheckIcon"

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode
  /** A muted consequence line under the label — what ticking this actually does. */
  hint?: ReactNode
  className?: string
}

/** A native checkbox, restyled. The whole label is the tap target (≥ 44px tall). */
export function Checkbox({ label, hint, className, ...input }: CheckboxProps) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-start gap-3 py-2 has-disabled:cursor-default has-disabled:opacity-50 ${className ?? ""}`}>
      <span className="grid h-6 shrink-0 place-items-center">
        <input
          type="checkbox"
          className="peer col-start-1 row-start-1 size-5 cursor-pointer appearance-none rounded-chip border-2 border-border-strong bg-background checked:border-o700 checked:bg-o700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 disabled:cursor-default"
          {...input}
        />
        <CheckIcon className="pointer-events-none col-start-1 row-start-1 size-3.5 text-background opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="flex flex-col">
        <span className="font-medium">{label}</span>
        {hint ? <span className="text-small text-pretty text-muted">{hint}</span> : null}
      </span>
    </label>
  )
}
