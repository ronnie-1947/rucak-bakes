import type { ReactNode } from "react"

type FieldProps = {
  /** The control's id — the label points at it, and the message line is `${id}-message` for aria-describedby. */
  id: string
  label: ReactNode
  /** "Required" or "Optional" — a micro tag at the end of the label row. */
  tag?: string
  /** A muted consequence line under the control. Replaced by `error` when there is one. */
  hint?: ReactNode
  error?: ReactNode
  /** Right side of the message line — "34 / 80". */
  counter?: ReactNode
  /** The counter is over its limit. */
  counterOver?: boolean
  children: ReactNode
  className?: string
}

const counters: Record<"over" | "ok", string> = {
  over: "text-red",
  ok: "text-muted",
}

/** One form control with its label above and its hint, error or counter below. Errors are inline, never a toast. */
export function Field({ id, label, tag, hint, error, counter, counterOver = false, children, className }: FieldProps) {
  const message = error ?? hint
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-small-admin text-muted">
          {label}
        </label>
        {tag ? <span className="text-micro font-semibold text-muted uppercase">{tag}</span> : null}
      </div>
      {children}
      {message || counter ? (
        <div id={`${id}-message`} className="flex justify-between gap-2 text-small-admin">
          <span className={error ? "text-red" : "text-pretty text-muted"}>{message}</span>
          {counter ? <span className={`shrink-0 tabular-nums ${counters[counterOver ? "over" : "ok"]}`}>{counter}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
