import { formatPaise } from "@/lib/money"
import type { CustomLine } from "@/lib/orders/queries"
import { fill } from "@/lib/template"
import type { AdminCopy } from "./types"

type CustomLinesProps = {
  lines: CustomLine[]
  dict: AdminCopy
  className?: string
}

/** The lines staff priced by hand, named — "Custom birthday cake ₹1,200 per kg · menu ₹1,500". Nothing when there are none. */
export function CustomLines({ lines, dict, className }: CustomLinesProps) {
  if (lines.length === 0) return null
  const text = lines
    .map((line) =>
      fill(dict.orders.customLine, {
        name: line.name,
        price: formatPaise(line.unitPricePaise),
        unit: dict.priceUnits[line.unit],
        menu: formatPaise(line.menuPricePaise),
      }),
    )
    .join(", ")
  return <span className={`truncate text-small-admin text-muted tabular-nums ${className ?? ""}`}>{text}</span>
}
