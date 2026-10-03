import { fill } from "@/lib/template"
import type { CustomersCopy } from "./types"

type CustomersHeaderProps = {
  total: number
  trusted: number
  blocked: number
  dict: CustomersCopy
}

/** "Customers" and the whole book in one line — how many, how many trusted, how many blocked. */
export function CustomersHeader({ total, trusted, blocked, dict }: CustomersHeaderProps) {
  const count = total === 0 ? dict.countNone : fill(total === 1 ? dict.countOne : dict.count, { count: total, trusted, blocked })
  return (
    <div className="flex flex-col px-4 pt-6 pb-4 md:px-6 lg:px-8">
      <h1 className="text-h1">{dict.title}</h1>
      <span className="text-small-admin text-muted tabular-nums">{count}</span>
    </div>
  )
}
