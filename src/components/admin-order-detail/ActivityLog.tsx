import { Icon } from "@/components/ui/icons/Icon"
import type { OrderDetailData } from "@/lib/orders/queries"
import { fill } from "@/lib/template"
import type { DetailCopy } from "./types"

type ActivityLogProps = {
  activity: OrderDetailData["activity"]
  dict: DetailCopy
}

/** Collapsed by default — a native <details>, no JavaScript. Derived from the order's own timestamps. */
export function ActivityLog({ activity, dict }: ActivityLogProps) {
  return (
    <details className="group border-t border-border">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-semibold">
        <span>{dict.activity}</span>
        <Icon name="chevronDown" className="size-5 text-muted transition-transform duration-150 ease-out group-open:rotate-180" />
      </summary>
      <ol className="flex flex-col gap-1 pb-2">
        {activity.map((entry, index) => (
          <li key={index} className="flex gap-2 text-micro text-muted uppercase">
            <span className="w-12 shrink-0">{entry.at}</span>
            <span>{fill(dict.activityKinds[entry.kind], { by: entry.by ?? "" })}</span>
          </li>
        ))}
      </ol>
    </details>
  )
}
