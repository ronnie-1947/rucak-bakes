import Link from "next/link"
import { CustomerFlags } from "@/components/customer-flags/CustomerFlags"
import { buttonClasses } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { fill } from "@/lib/template"
import { historyText, isWarned, noShowsText } from "./copy"
import { CustomerMenu } from "./CustomerMenu"
import type { AdminCopy, BoardCustomer } from "./types"

type CustomerCardProps = {
  customer: BoardCustomer
  dict: AdminCopy
}

type Frame = "current" | "warned" | "plain"

const frames: Record<Frame, string> = {
  current: "border-o700 bg-o50",
  /** Two or more no-shows: a red edge and tint — worth a word before verifying. */
  warned: "border-border border-l-4 border-l-red bg-red-soft pl-2",
  plain: "border-border bg-background hover:border-border-strong",
}

/**
 * One customer on phones and tablets (and beside the 1600px pane): name and flags, the number to call,
 * how often they order and how often they didn't turn up, what they usually have. The card opens the
 * record; the number, Call and ⋯ sit above that link.
 */
export function CustomerCard({ customer, dict }: CustomerCardProps) {
  const d = dict.customers
  const frame: Frame = customer.current ? "current" : isWarned(customer) ? "warned" : "plain"
  const noShows = noShowsText(customer, d)
  const open = fill(d.open, { name: customer.name })

  return (
    <article className={`relative flex min-h-22 min-w-0 flex-col gap-1 rounded-panel border p-3 ${frames[frame]}`}>
      <Link href={customer.links.page} aria-label={open} className="absolute inset-0 rounded-panel 2xl:hidden" />
      <Link href={customer.links.pane} aria-label={open} scroll={false} className="absolute inset-0 hidden rounded-panel 2xl:block" />

      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 font-medium break-words">{customer.name}</span>
        <CustomerFlags flags={customer} dict={dict.customerFlags} className="justify-end" />
      </div>
      <a href={`tel:${customer.phoneE164}`} className="relative z-10 flex items-center gap-2 self-start font-medium text-o700 tabular-nums hover:underline">
        <Icon name="phone" className="size-3.5" />
        {customer.phoneDisplay}
      </a>
      <span className="text-small-admin tabular-nums">
        {historyText(customer, d)}
        {noShows ? <span className="font-semibold text-red"> · {noShows}</span> : null}
      </span>
      {customer.usual ? <span className="truncate text-small-admin text-muted">{fill(d.usual, { name: customer.usual })}</span> : null}

      <div className="relative z-10 mt-1 flex items-center gap-2">
        <a href={`tel:${customer.phoneE164}`} aria-label={fill(d.callName, { name: customer.name })} className={buttonClasses("outlineLink", "md")}>
          <Icon name="phone" className="size-4" />
          <span>{d.call}</span>
        </a>
        <span className="ml-auto">
          <CustomerMenu customer={customer} pageHref={customer.links.page} dict={dict} direction="up" />
        </span>
      </div>
    </article>
  )
}
