import Link from "next/link"
import { OrderActionsProvider } from "@/components/order-actions/OrderActionsProvider"
import { buttonClasses } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { Notice } from "@/components/ui/Notice"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Tag } from "@/components/ui/Tag"
import type { OrderDetailData } from "@/lib/orders/queries"
import { fill } from "@/lib/template"
import { ActionBar } from "./ActionBar"
import { AddedBar } from "./AddedBar"
import { ActivityLog } from "./ActivityLog"
import { ClosedBlock } from "./ClosedBlock"
import { copyText } from "./copy-text"
import { CustomerCard } from "./CustomerCard"
import { CustomerNote } from "./CustomerNote"
import { FulfilmentFacts } from "./FulfilmentFacts"
import { InternalNote } from "./InternalNote"
import { ItemsTable } from "./ItemsTable"
import { OrderMenu } from "./OrderMenu"
import { Timeline } from "./Timeline"
import type { AdminCopy, DetailVariant } from "./types"

type OrderDetailProps = {
  order: OrderDetailData
  dict: AdminCopy
  variant: DetailVariant
  /** Page variant: where "All orders" goes back to. */
  backHref?: string
  /** Page variant, arriving from New order (`?added=1`) — the green "added" line. */
  added?: boolean
}

const frames: Record<DetailVariant, string> = {
  page: "mx-auto flex w-full max-w-3xl flex-col px-4 md:px-6 lg:px-8",
  pane: "flex h-full min-h-0 flex-col",
}

const bodies: Record<DetailVariant, string> = {
  page: "flex flex-col gap-6 pt-4 pb-6",
  pane: "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4",
}

const headers: Record<DetailVariant, string> = {
  page: "flex flex-wrap items-center gap-3 pt-4",
  pane: "flex shrink-0 items-center gap-3 border-b border-border px-4 py-3",
}

/**
 * One order, everything staff need to act on it: progress, who to call, the customer's note (allergies)
 * where it can't be missed, the lines, the team note, and the one next step. Shared by the order page
 * and the 2xl split pane; status changes go through its own OrderActionsProvider.
 */
export function OrderDetail({ order, dict, variant, backHref, added = false }: OrderDetailProps) {
  const d = dict.orderDetail
  const target = { id: order.id, code: order.code, name: order.customer.name }
  const Heading = variant === "page" ? "h1" : "h2"
  const overCapacity =
    order.status === "PENDING" && order.capacity.verifiedCount + 1 > order.capacity.maxOrders
      ? { wouldBe: order.capacity.verifiedCount + 1, max: order.capacity.maxOrders, day: order.dayLabel }
      : null
  const completedAt = order.status === "COMPLETED" ? (order.timeline.find((step) => step.status === "COMPLETED")?.at ?? "") : null

  return (
    <OrderActionsProvider dict={dict.orders}>
      <article className={frames[variant]}>
        {variant === "page" && backHref ? (
          <Link href={backHref} className={buttonClasses("link", "inline", "self-start gap-1 print:hidden")}>
            <Icon name="chevronLeft" className="size-4" />
            {d.back}
          </Link>
        ) : null}

        <header className={headers[variant]}>
          <Heading className="text-h1">{order.code}</Heading>
          <StatusBadge status={order.status} label={dict.orderStatus[order.status]} />
          {order.byStaff ? <Tag>{fill(d.byStaff, { name: order.byStaff })}</Tag> : null}
          <span className="flex-1" />
          <OrderMenu target={target} status={order.status} copyText={copyText(order, dict)} dict={d} />
        </header>

        <div className={bodies[variant]}>
          {added && order.byStaff ? (
            <AddedBar orderId={order.id} code={order.code} name={order.customer.name.trim().split(/\s+/)[0]} dict={d} />
          ) : null}
          {order.isSuspected ? <Notice tone="error">{d.suspected}</Notice> : null}
          {order.notificationFailed ? <Notice tone="warm">{d.unnotified}</Notice> : null}
          {order.closed ? <ClosedBlock closed={order.closed} dict={d} /> : <Timeline timeline={order.timeline} status={order.status} dict={dict} />}
          <CustomerCard customer={order.customer} dict={dict} />
          {order.customerNote ? <CustomerNote note={order.customerNote} label={d.customerNote} /> : null}
          <ItemsTable order={order} dict={d} />
          <FulfilmentFacts order={order} dict={dict} />
          <InternalNote key={order.id} orderId={order.id} note={order.internalNote} dict={d} />
          <ActivityLog activity={order.activity} dict={d} />
        </div>

        <ActionBar target={target} status={order.status} overCapacity={overCapacity} completedAt={completedAt} dict={d} variant={variant} />
      </article>
    </OrderActionsProvider>
  )
}
