import Link from "next/link"
import { CustomerFlags } from "@/components/customer-flags/CustomerFlags"
import type { CustomerLookup } from "@/lib/customers/lookup"
import { fill } from "@/lib/template"
import type { FormCopy } from "./types"

type KnownCustomerProps = {
  customer: CustomerLookup
  /** Leaving for their record with something entered asks first — true when it did. */
  onLeave: (href: string) => boolean
  dict: FormCopy
}

/** A number we know: who it is, how they stand, their saved address, and the way to their record. Blocked says so in red. */
export function KnownCustomer({ customer, onLeave, dict }: KnownCustomerProps) {
  const c = dict.newOrder.customer
  const href = `/admin/customers/${customer.id}`
  const history = [
    customer.completedCount > 0 ? fill(c.before, { count: customer.completedCount }) : c.beforeNone,
    ...(customer.lastOrderLabel ? [fill(c.lastOn, { date: customer.lastOrderLabel })] : []),
  ].join(" · ")

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1 rounded-panel bg-sunken p-3">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold break-words">{customer.name}</span>
          <CustomerFlags flags={customer.flags} dict={dict.customerFlags} />
        </span>
        <span className="text-small-admin text-muted tabular-nums">{history}</span>
        {customer.address ? <span className="text-small-admin break-words">{customer.address}</span> : null}
        <Link
          href={href}
          onClick={(event) => {
            if (onLeave(href)) event.preventDefault()
          }}
          className="flex min-h-11 items-center self-start text-small-admin font-semibold text-o700 hover:underline"
        >
          {c.view}
        </Link>
      </div>
      {customer.flags.isBlocked ? <p className="text-small-admin font-semibold text-red">{c.blocked}</p> : null}
    </div>
  )
}
