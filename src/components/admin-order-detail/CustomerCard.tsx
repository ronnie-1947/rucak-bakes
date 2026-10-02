import Link from "next/link"
import { OrderTagList } from "@/components/order-tag-list/OrderTagList"
import { buttonClasses } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { formatPaise } from "@/lib/money"
import type { OrderDetailData } from "@/lib/orders/queries"
import { fill } from "@/lib/template"
import type { AdminCopy } from "./types"

type CustomerCardProps = {
  customer: OrderDetailData["customer"]
  dict: AdminCopy
}

/** Who to call, how to reach them, and their last three orders inline — enough to judge the order. */
export function CustomerCard({ customer, dict }: CustomerCardProps) {
  const d = dict.orderDetail
  const whatsapp = `https://wa.me/${customer.phoneE164.replace(/\D/g, "")}`

  return (
    <section className="flex flex-col gap-3 rounded-panel border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h3 className="text-h2">{customer.name}</h3>
          <a href={`tel:${customer.phoneE164}`} className="flex min-h-11 items-center gap-2 text-h2 font-semibold text-o700 hover:underline">
            <Icon name="phone" className="size-5" />
            <span>{customer.phoneDisplay}</span>
          </a>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 xs:w-auto">
          <a href={`tel:${customer.phoneE164}`} className={buttonClasses("primary", "md", "font-semibold xs:w-32")}>
            {d.callButton}
          </a>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={buttonClasses("outlineLink", "md", "xs:w-32")}>
            {d.whatsapp}
          </a>
        </div>
      </div>

      <OrderTagList tags={customer.tags} dict={dict.orderTags} include={["suspected", "before", "trusted", "noShows"]} />

      <div className="flex flex-col border-t border-border pt-2">
        {customer.history.length === 0 ? (
          <p className="py-1 text-small-admin text-muted">{d.firstOrder}</p>
        ) : (
          <ul className="flex flex-col">
            {customer.history.map((past) => (
              <li key={past.id}>
                <Link href={`/admin/orders/${past.id}`} className="flex gap-2 py-1 text-small-admin hover:bg-sunken">
                  <span className="w-20 shrink-0">{past.dayLabel}</span>
                  <span className="w-16 shrink-0 text-muted">{past.itemCount === 1 ? d.historyItemsOne : fill(d.historyItems, { count: past.itemCount })}</span>
                  <span className="w-16 shrink-0">{formatPaise(past.totalPaise)}</span>
                  <span className="ml-auto text-muted">{dict.orderStatus[past.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href={`/admin/customers/${customer.id}`} className={buttonClasses("link", "inline", "self-start")}>
          {d.viewCustomer}
        </Link>
      </div>
    </section>
  )
}
