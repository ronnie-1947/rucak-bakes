import type { OrderDetailData } from "@/lib/orders/queries"
import { fill } from "@/lib/template"
import type { AdminCopy } from "./types"

type FulfilmentFactsProps = {
  order: Pick<OrderDetailData, "fulfilmentType" | "dayLabel" | "relative" | "pickupTime" | "deliveryAddress">
  dict: AdminCopy
}

/** Pickup or delivery, which day, what time, and where. */
export function FulfilmentFacts({ order, dict }: FulfilmentFactsProps) {
  const f = dict.orderDetail.facts
  const day = fill(dict.orders.groupDay[order.relative ?? "other"], { date: order.dayLabel })
  const term = "text-muted"
  return (
    <dl className="grid grid-cols-3 gap-x-3 gap-y-2 rounded-panel border border-border p-3 sm:grid-cols-4">
      <dt className={term}>{f.fulfilment}</dt>
      <dd className="col-span-2 font-semibold sm:col-span-3">{order.fulfilmentType === "DELIVERY" ? f.delivery : f.pickup}</dd>
      <dt className={term}>{f.date}</dt>
      <dd className="col-span-2 sm:col-span-3">{day}</dd>
      <dt className={term}>{f.time}</dt>
      <dd className="col-span-2 sm:col-span-3">{order.pickupTime ?? f.anyTime}</dd>
      {order.deliveryAddress ? (
        <>
          <dt className={term}>{f.address}</dt>
          <dd className="col-span-2 flex flex-col sm:col-span-3">
            <span className="whitespace-pre-line">{order.deliveryAddress}</span>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center font-semibold text-o700 hover:underline"
            >
              {f.maps}
            </a>
          </dd>
        </>
      ) : null}
    </dl>
  )
}
