import { fill } from "@/lib/template"
import type { OrdersCopy } from "./types"

type ItemsLineProps = {
  lines: { name: string; quantity: number }[]
  dict: OrdersCopy
  /** How many lines to name before "+n more". */
  show?: number
  className?: string
}

/** "2× Sourdough loaf, 1× Brownie box +1 more" — one line, truncated. */
export function ItemsLine({ lines, dict, show = 2, className }: ItemsLineProps) {
  const named = lines.slice(0, show).map((line) => fill(dict.items, { quantity: line.quantity, name: line.name }))
  const rest = lines.length - named.length
  return (
    <span className={`truncate ${className ?? ""}`}>
      {named.join(", ")}
      {rest > 0 ? ` ${fill(dict.itemsMore, { count: rest })}` : null}
    </span>
  )
}
