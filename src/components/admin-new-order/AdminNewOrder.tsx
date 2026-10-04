import type { NewOrderPage } from "@/lib/orders/new-order"
import { NewOrderForm } from "./NewOrderForm"
import type { AdminCopy } from "./types"

type AdminNewOrderProps = {
  dict: AdminCopy
  page: NewOrderPage
  /** From the URL's `?date=` / `?customer=` — a different link starts a fresh form; a refresh keeps what's entered. */
  formKey: string
}

/** /admin/orders/new — staff enter an order a customer gave them by phone or at the counter (dev-docs/implementation.md 7R.5). */
export function AdminNewOrder({ dict, page, formKey }: AdminNewOrderProps) {
  return (
    <NewOrderForm key={formKey} page={page} dict={{ newOrder: dict.newOrder, customerFlags: dict.customerFlags, priceUnits: dict.priceUnits }} />
  )
}
