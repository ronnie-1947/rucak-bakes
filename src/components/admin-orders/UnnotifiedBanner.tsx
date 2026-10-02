import Link from "next/link"
import { Fragment } from "react"
import { Notice } from "@/components/ui/Notice"
import { Rich } from "@/components/ui/Rich"
import type { OrdersCopy } from "./types"

type UnnotifiedBannerProps = {
  orders: { id: string; code: string }[]
  dict: OrdersCopy
}

/**
 * Telegram failed for these new orders. The orders are safe (the database write is the order), but the
 * owner was never pinged — so the queue says so until each one is dealt with.
 */
export function UnnotifiedBanner({ orders, dict }: UnnotifiedBannerProps) {
  if (orders.length === 0) return null
  const codes = orders.map((order, index) => (
    <Fragment key={order.id}>
      {index > 0 ? ", " : null}
      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-o700 underline">
        {order.code}
      </Link>
    </Fragment>
  ))
  return (
    <Notice tone="warm">
      <Rich template={orders.length === 1 ? dict.unnotifiedOne : dict.unnotified} values={{ count: orders.length, codes }} />
    </Notice>
  )
}
