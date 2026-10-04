import { OrderDetail } from "@/components/admin-order-detail/OrderDetail"
import { OrderActionsProvider } from "@/components/order-actions/OrderActionsProvider"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { EmptyState } from "@/components/ui/EmptyState"
import { CLEARED, filtersHref, isDefault, type OrderFilters } from "@/lib/orders/filters"
import type { OrderDetailData, OrderQueue } from "@/lib/orders/queries"
import { OrderBoard } from "./OrderBoard"
import { OrdersFilterBar } from "./OrdersFilterBar"
import { OrdersHeader } from "./OrdersHeader"
import type { AdminCopy } from "./types"
import { UnnotifiedBanner } from "./UnnotifiedBanner"

type AdminOrdersProps = {
  dict: AdminCopy
  queue: OrderQueue
  filters: OrderFilters
  /** The order open in the 2xl split pane (`?order=`), if any. */
  pane: OrderDetailData | null
}

const layouts: Record<"split" | "single", string> = {
  split: "2xl:grid-cols-9",
  single: "",
}

/** The queue's share of the split (4 of 9 ≈ 45%); without a pane it takes the row. */
const boardSpans: Record<"split" | "single", string> = {
  split: "2xl:col-span-4",
  single: "",
}

/**
 * /admin/orders — the queue. Default view: Upcoming — today onward, grouped by date, pending first. Phones get cards, the
 * kitchen tablet two columns of cards, laptops a table, and from 1600px an order can open in a split
 * pane beside the table.
 */
export function AdminOrders({ dict, queue, filters, pane }: AdminOrdersProps) {
  const split = pane ? "split" : "single"
  const boardGroups = queue.groups.map((group) => ({
    ...group,
    orders: group.orders.map((order) => ({
      ...order,
      links: { page: `/admin/orders/${order.id}`, pane: filtersHref({ ...filters, order: order.id, select: false }) },
    })),
  }))
  const onlyToday = filters.dates.length === 1 && filters.dates[0] === "today" && filters.status === "ALL" && filters.show.length === 0 && !filters.q

  return (
    <div className="flex flex-col">
      <OrdersHeader dict={dict.orders} capacity={queue.capacity} filters={filters} />
      <OrdersFilterBar dict={dict.orders} filters={filters} paneOpen={Boolean(pane)} />

      <div className={`grid gap-6 px-4 pt-4 pb-6 md:px-6 lg:px-8 ${layouts[split]}`}>
        <div className={`flex min-w-0 flex-col gap-4 ${boardSpans[split]}`}>
          <UnnotifiedBanner orders={queue.unnotified} dict={dict.orders} />
          {boardGroups.length === 0 ? (
            isDefault(filters) ? (
              <EmptyState message={dict.orders.emptyUpcoming} />
            ) : onlyToday ? (
              <EmptyState
                message={dict.orders.emptyToday}
                action={
                  <ButtonLink href={filtersHref({ ...CLEARED, dates: ["tomorrow"], order: null, select: false })} variant="outlineLink">
                    {dict.orders.viewTomorrow}
                  </ButtonLink>
                }
              />
            ) : (
              <EmptyState
                message={dict.orders.emptyFiltered}
                action={
                  <ButtonLink href={filtersHref({ ...CLEARED, order: null, select: false })} variant="outlineLink">
                    {dict.orders.filters.clear}
                  </ButtonLink>
                }
              />
            )
          ) : (
            <OrderActionsProvider dict={dict.orders}>
              <OrderBoard
                dict={dict}
                groups={boardGroups}
                selectMode={filters.select}
                exitSelectHref={filtersHref({ ...filters, select: false })}
                paneOpen={Boolean(pane)}
                currentId={pane?.id ?? null}
              />
            </OrderActionsProvider>
          )}
        </div>

        {pane ? (
          <aside className="hidden min-w-0 overflow-hidden rounded-card border border-border bg-background 2xl:sticky 2xl:top-4 2xl:col-span-5 2xl:block 2xl:h-pane">
            <OrderDetail key={pane.id} order={pane} dict={dict} variant="pane" />
          </aside>
        ) : null}
      </div>
    </div>
  )
}
