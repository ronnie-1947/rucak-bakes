import type { CustomerDetailData } from "@/lib/customers/detail"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import type { DetailCopy } from "./types"

type FactsStripProps = {
  facts: CustomerDetailData["facts"]
  dict: DetailCopy["facts"]
}

const values: Record<"warn" | "plain", string> = {
  warn: "text-red",
  plain: "",
}

/** Four counts in a row — orders, completed, cancelled, no-shows (red when there are any) — and what they've spent. */
export function FactsStrip({ facts, dict }: FactsStripProps) {
  const items = [
    { key: "orders", label: dict.orders, value: facts.orders, warn: false },
    { key: "completed", label: dict.completed, value: facts.completed, warn: false },
    { key: "cancelled", label: dict.cancelled, value: facts.cancelled, warn: false },
    { key: "noShows", label: dict.noShows, value: facts.noShows, warn: facts.noShows > 0 },
  ]
  return (
    <div className="flex flex-col gap-2">
      <dl aria-label={dict.label} className="grid grid-cols-4 border-y border-border py-3">
        {items.map((item) => (
          <div key={item.key} className="flex min-w-0 flex-col border-l border-border px-3 first:border-l-0 first:pl-0">
            <dt className="truncate text-micro font-semibold text-muted uppercase">{item.label}</dt>
            <dd className={`font-display text-h2 font-semibold tabular-nums ${values[item.warn ? "warn" : "plain"]}`}>{item.value}</dd>
          </div>
        ))}
      </dl>
      <span className="text-small-admin text-muted tabular-nums">{fill(dict.spent, { amount: formatPaise(facts.spentPaise) })}</span>
    </div>
  )
}
