import { Container } from "@/components/ui/Container"
import type { CustomerDetailData } from "@/lib/customers/detail"
import { ContactCard } from "./ContactCard"
import { DetailHeader } from "./DetailHeader"
import { FactsStrip } from "./FactsStrip"
import { FlagCard } from "./FlagCard"
import { NoteCard } from "./NoteCard"
import { OrderHistory } from "./OrderHistory"
import { PatternsCard } from "./PatternsCard"
import { RecentOrders } from "./RecentOrders"
import type { AdminCopy, DetailVariant } from "./types"

type CustomerDetailProps = {
  customer: CustomerDetailData
  dict: AdminCopy
  variant: DetailVariant
}

/**
 * One customer — a page of a shopkeeper's notebook. On the page: their orders (open ones first, then by
 * month), patterns and the team's note, beside a sticky column with the number to call, trust / block and
 * the counts; on phones that column comes first. In the list's 1600px pane: the column, the latest orders
 * and patterns, with the way to the full record. Flag changes go through the nearest CustomerActionsProvider.
 */
export function CustomerDetail({ customer, dict, variant }: CustomerDetailProps) {
  const d = dict.customerDetail
  const side = (
    <>
      <ContactCard customer={customer} dict={d.contact} />
      <FlagCard customer={customer} dict={dict} showStatus={variant === "page"} />
      <FactsStrip facts={customer.facts} dict={d.facts} />
    </>
  )

  if (variant === "pane") {
    return (
      <article className="flex h-full min-h-0 flex-col">
        <DetailHeader customer={customer} variant="pane" dict={dict} />
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {side}
          <RecentOrders customer={customer} dict={dict} />
          {customer.patterns ? <PatternsCard patterns={customer.patterns} dict={d.patterns} /> : null}
        </div>
      </article>
    )
  }

  return (
    <Container as="article" className="flex flex-col gap-4 pt-4 pb-12 md:pt-6 lg:pt-8">
      <DetailHeader customer={customer} variant="page" dict={dict} />
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,60fr)_minmax(0,40fr)] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6 lg:gap-8">
          <OrderHistory customer={customer} dict={dict} />
          {customer.patterns ? <PatternsCard patterns={customer.patterns} dict={d.patterns} /> : null}
          <NoteCard customerId={customer.id} note={customer.internalNote} dict={d.note} />
        </div>
        <div className="-order-1 flex min-w-0 flex-col gap-3 md:sticky md:top-6 md:order-none">{side}</div>
      </div>
    </Container>
  )
}
