import type { ReactNode } from "react"

type VisitRowProps = {
  label: string
  children: ReactNode
}

/** Label left in muted, value right-aligned — a definition-list pair. */
export function VisitRow({ label, children }: VisitRowProps) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="flex min-w-0 flex-col items-end text-right text-pretty tabular-nums">{children}</dd>
    </div>
  )
}
