import Link from "next/link"
import { CustomerFlags } from "@/components/customer-flags/CustomerFlags"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { Icon } from "@/components/ui/icons/Icon"
import type { CustomerDetailData } from "@/lib/customers/detail"
import type { AdminCopy, DetailVariant } from "./types"

type DetailHeaderProps = {
  customer: CustomerDetailData
  variant: DetailVariant
  dict: AdminCopy
}

const frames: Record<DetailVariant, string> = {
  page: "flex items-start gap-2",
  pane: "flex shrink-0 items-center gap-2 border-b border-border px-4 py-3",
}

/** Back to the list (page), the name with its flags, New order for them (page); in the pane, the way to the full record. */
export function DetailHeader({ customer, variant, dict }: DetailHeaderProps) {
  const d = dict.customerDetail
  const Heading = variant === "page" ? "h1" : "h2"
  return (
    <header className={frames[variant]}>
      {variant === "page" ? (
        <Link
          href="/admin/customers"
          aria-label={d.back}
          className="grid size-11 shrink-0 place-items-center rounded-button hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
        >
          <Icon name="chevronLeft" className="size-5.5" />
        </Link>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <Heading className="text-h1 break-words">{customer.name}</Heading>
        <CustomerFlags flags={customer} dict={dict.customerFlags} />
      </div>
      {variant === "page" ? (
        <ButtonLink href={`/admin/orders/new?customer=${customer.id}`} variant="outlineLink" size="sm" className="shrink-0">
          <Icon name="plus" className="size-4" />
          {d.newOrder}
        </ButtonLink>
      ) : null}
      {variant === "pane" ? (
        <Link href={`/admin/customers/${customer.id}`} className="flex min-h-11 shrink-0 items-center text-small-admin font-semibold text-o700 hover:underline">
          {d.openFull}
        </Link>
      ) : null}
    </header>
  )
}
