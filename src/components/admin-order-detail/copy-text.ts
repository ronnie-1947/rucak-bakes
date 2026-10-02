import { formatPaise } from "@/lib/money"
import type { OrderDetailData } from "@/lib/orders/queries"
import { fill } from "@/lib/template"
import type { AdminCopy } from "./types"

/** The plain-text order "Copy details" puts on the clipboard — for pasting into WhatsApp or a delivery app. */
export function copyText(order: OrderDetailData, dict: AdminCopy): string {
  const when = order.fulfilmentType === "DELIVERY" ? dict.orders.deliveryAny : dict.orders.pickupAny
  return [
    `${order.code} · ${order.dayLabel} · ${when}${order.pickupTime ? ` ${order.pickupTime}` : ""}`,
    `${order.customer.name} · ${order.customer.phoneDisplay}`,
    ...order.lines.map((line) => `${fill(dict.orders.items, { quantity: line.quantity, name: line.name })}  ${formatPaise(line.lineTotalPaise)}`),
    `${dict.orderDetail.total} ${formatPaise(order.totalPaise)}`,
    ...(order.deliveryAddress ? [order.deliveryAddress] : []),
    ...(order.customerNote ? [`${dict.orderDetail.customerNote}: ${order.customerNote}`] : []),
  ].join("\n")
}
