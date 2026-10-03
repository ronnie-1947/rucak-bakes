import type { CustomerPatterns } from "@/lib/customers/detail"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import type { DetailCopy } from "./types"

type PatternsCardProps = {
  patterns: CustomerPatterns
  dict: DetailCopy["patterns"]
}

/** Three plain lines from their orders — what they have, which day, how much. No charts, no scores. */
export function PatternsCard({ patterns, dict }: PatternsCardProps) {
  const usual = patterns.usual.map((item) => fill(item.count === 1 ? dict.usualItemOnce : dict.usualItem, item)).join(", ")
  return (
    <section aria-labelledby="patterns-title" className="flex flex-col gap-1 rounded-panel border border-border p-3 tabular-nums">
      <h2 id="patterns-title" className="pb-1 font-sans text-micro font-semibold text-muted uppercase">
        {dict.title}
      </h2>
      <p>{fill(dict.usual, { list: usual })}</p>
      <p>{fill(dict.weekday, { day: patterns.weekday })}</p>
      <p>{fill(dict.average, { amount: formatPaise(patterns.averagePaise) })}</p>
    </section>
  )
}
