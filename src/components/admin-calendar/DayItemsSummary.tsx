import { fill } from "@/lib/template"
import { namesPreview } from "./copy"
import type { CalendarCopy } from "./types"

type DayItemsSummaryProps = {
  items: string[]
  dict: CalendarCopy
}

/**
 * What's on sale that day. Narrow cards: the count and the first three names on one line. The seven narrow
 * columns from 1280px have the height for every name, one per line.
 */
export function DayItemsSummary({ items, dict }: DayItemsSummaryProps) {
  const count = items.length === 0 ? dict.noItems : items.length === 1 ? dict.itemsScheduledOne : fill(dict.itemsScheduled, { count: items.length })
  return (
    <>
      <div className="flex min-w-0 flex-col xl:hidden">
        <span className="font-medium tabular-nums">{count}</span>
        <span className="truncate text-small-admin text-muted">{items.length === 0 ? dict.noItemsHint : namesPreview(items, dict)}</span>
      </div>
      <div className="hidden min-w-0 flex-col gap-1 xl:flex">
        <span className="text-micro font-semibold text-muted uppercase tabular-nums">{count}</span>
        {items.length === 0 ? <span className="text-small-admin text-muted">{dict.noItemsHint}</span> : null}
        <ul className="flex flex-col">
          {items.map((name) => (
            <li key={name} className="text-small-admin break-words">
              {name}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
