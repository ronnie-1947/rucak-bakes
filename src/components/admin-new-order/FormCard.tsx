import type { ReactNode } from "react"

type FormCardProps = {
  id: string
  title: string
  /** Right of the title — "3 lines". */
  aside?: ReactNode
  children: ReactNode
}

/** One of the form's four cards — Customer, Items, When, Notes — in the order the conversation goes. 1px border, no shadow. */
export function FormCard({ id, title, aside, children }: FormCardProps) {
  return (
    <section aria-labelledby={`${id}-title`} className="flex min-w-0 flex-col gap-3 rounded-panel border border-border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={`${id}-title`} className="text-h2">
          {title}
        </h2>
        {aside ? <span className="text-small-admin text-muted tabular-nums">{aside}</span> : null}
      </div>
      {children}
    </section>
  )
}
