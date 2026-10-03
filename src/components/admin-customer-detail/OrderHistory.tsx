"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import type { CustomerDetailData } from "@/lib/customers/detail"
import { fill } from "@/lib/template"
import { HistoryRow } from "./HistoryRow"
import { MonthGroup } from "./MonthGroup"
import type { AdminCopy } from "./types"

type OrderHistoryProps = {
  customer: Pick<CustomerDetailData, "live" | "past" | "monthCounts">
  dict: AdminCopy
}

/** How many past orders show before "Show older orders". */
const PAGE = 20

/**
 * Every order the customer has placed: anything still open first, framed and marked Active, then the rest
 * newest first under sticky month headers ("October 2026 · 4 orders"), twenty at a time.
 */
export function OrderHistory({ customer, dict }: OrderHistoryProps) {
  const h = dict.customerDetail.history
  const [shown, setShown] = useState(PAGE)
  const past = customer.past.slice(0, shown)
  const months = [...new Set(past.map((order) => order.month))]
  const older = customer.past.length - past.length

  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-2">
      <h2 id="history-title" className="text-h2">
        {h.title}
      </h2>
      {customer.live.length + customer.past.length === 0 ? <p className="text-muted">{h.none}</p> : null}
      {customer.live.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {customer.live.map((order) => (
            <HistoryRow key={order.id} order={order} live dict={dict} />
          ))}
        </ul>
      ) : null}
      {months.map((month) => (
        <MonthGroup
          key={month}
          month={month}
          orders={past.filter((order) => order.month === month)}
          count={customer.monthCounts[month] ?? 0}
          dict={dict}
        />
      ))}
      {older > 0 ? (
        <Button variant="outlineLink" className="tabular-nums" onClick={() => setShown((value) => value + PAGE)}>
          {fill(h.more, { count: older })}
        </Button>
      ) : null}
    </section>
  )
}
