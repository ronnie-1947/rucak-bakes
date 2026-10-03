import Link from "next/link"
import { CustomerFlags } from "@/components/customer-flags/CustomerFlags"
import { buttonClasses } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { fill } from "@/lib/template"
import { isWarned } from "./copy"
import { CustomerMenu } from "./CustomerMenu"
import type { AdminCopy, BoardCustomer } from "./types"

type CustomerTableRowProps = {
  customer: BoardCustomer
  dict: AdminCopy
}

type Look = "warned" | "plain"

const rows: Record<Look, string> = {
  warned: "bg-red-soft",
  plain: "hover:bg-sunken",
}

/** The left-edge marker lives on the first cell — a <tr> can't carry a border-left reliably. */
const edges: Record<Look, string> = {
  warned: "border-l-4 border-l-red pl-2",
  plain: "border-l-4 border-l-transparent pl-2",
}

const noShowLooks: Record<"some" | "none", string> = {
  some: "font-semibold text-red",
  none: "text-muted",
}

/** One customer in the 1024px+ table. The name opens the record; the number and Call ring them. */
export function CustomerTableRow({ customer, dict }: CustomerTableRowProps) {
  const d = dict.customers
  const look: Look = isWarned(customer) ? "warned" : "plain"

  return (
    <tr className={`border-b border-border last:border-b-0 ${rows[look]}`}>
      <td className={`max-w-0 py-2 pr-2 ${edges[look]}`}>
        <span className="flex flex-col">
          <Link href={customer.links.page} className="truncate font-medium hover:text-o700 hover:underline">
            {customer.name}
          </Link>
          {customer.usual ? <span className="truncate text-small-admin text-muted">{fill(d.usualShort, { name: customer.usual })}</span> : null}
        </span>
      </td>
      <td className="px-2 py-2 whitespace-nowrap">
        <a href={`tel:${customer.phoneE164}`} className="text-o700 tabular-nums hover:underline">
          {customer.phoneDisplay}
        </a>
      </td>
      <td className="px-2 py-2 text-right tabular-nums">{customer.orderCount}</td>
      <td className="px-2 py-2 whitespace-nowrap tabular-nums">{customer.lastOrderLabel ?? "—"}</td>
      <td className={`px-2 py-2 text-right tabular-nums ${noShowLooks[customer.noShowCount > 0 ? "some" : "none"]}`}>{customer.noShowCount}</td>
      <td className="px-2 py-2">
        <CustomerFlags flags={customer} dict={dict.customerFlags} />
      </td>
      <td className="py-2 pr-3 pl-2">
        <span className="flex justify-end gap-2">
          <a href={`tel:${customer.phoneE164}`} aria-label={fill(d.callName, { name: customer.name })} className={buttonClasses("outlineLink", "sm", "w-11 px-0")}>
            <Icon name="phone" className="size-4" />
          </a>
          <CustomerMenu customer={customer} pageHref={customer.links.page} dict={dict} />
        </span>
      </td>
    </tr>
  )
}
