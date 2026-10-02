import type { ReactNode } from "react"

type FormSectionProps = {
  /** The anchor the error summary scrolls to. */
  id: string
  title: string
  /** The section holds an error — a red frame. */
  invalid?: boolean
  children: ReactNode
  className?: string
}

const frames: Record<"invalid" | "valid", string> = {
  invalid: "border-red",
  valid: "border-border",
}

/** One card of the form — Basics, Photos, Details, Fulfilment. 1px border, no shadow. */
export function FormSection({ id, title, invalid = false, children, className }: FormSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`flex scroll-mt-6 flex-col gap-4 rounded-panel border p-3 ${frames[invalid ? "invalid" : "valid"]} ${className ?? ""}`}
    >
      <h2 id={`${id}-title`} className="text-h2">
        {title}
      </h2>
      {children}
    </section>
  )
}
