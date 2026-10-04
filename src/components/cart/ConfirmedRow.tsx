import type { ReactNode } from "react"

type ConfirmedRowProps = {
  label: ReactNode
  children: ReactNode
  /** The total: label in bold, the amount larger in o700. */
  strong?: boolean
}

const looks: Record<"strong" | "plain", { term: string; value: string }> = {
  strong: { term: "font-semibold", value: "text-h2 font-semibold text-o700 tabular-nums" },
  plain: { term: "text-muted", value: "text-pretty" },
}

/** One fact of the placed order — label left, value right. */
export function ConfirmedRow({ label, children, strong = false }: ConfirmedRowProps) {
  const look = looks[strong ? "strong" : "plain"]
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className={`shrink-0 ${look.term}`}>{label}</dt>
      <dd className={`min-w-0 text-right ${look.value}`}>{children}</dd>
    </div>
  )
}
