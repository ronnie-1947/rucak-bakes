import { CustomerDetail } from "@/components/admin-customer-detail/CustomerDetail"
import { CustomerActionsProvider } from "@/components/customer-actions/CustomerActionsProvider"
import { CustomerActionsStatus } from "@/components/customer-actions/CustomerActionsStatus"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { EmptyState } from "@/components/ui/EmptyState"
import type { CustomerDetailData } from "@/lib/customers/detail"
import { type CustomerFilters, customersHref, looksLikeNumber } from "@/lib/customers/filters"
import type { CustomerList } from "@/lib/customers/queries"
import { fill } from "@/lib/template"
import { CustomerBoard } from "./CustomerBoard"
import { CustomersFilterBar } from "./CustomersFilterBar"
import { CustomersHeader } from "./CustomersHeader"
import type { AdminCopy, BoardCustomer } from "./types"

type AdminCustomersProps = {
  dict: AdminCopy
  list: CustomerList
  filters: CustomerFilters
  /** The customer open in the 2xl split pane (`?customer=`), if any. */
  pane: CustomerDetailData | null
}

const layouts: Record<"split" | "single", string> = {
  split: "2xl:grid-cols-5",
  single: "",
}

/** The list's share of the split (2 of 5 = 40%); without a pane it takes the row. */
const listSpans: Record<"split" | "single", string> = {
  split: "2xl:col-span-2",
  single: "",
}

/**
 * /admin/customers — a shopkeeper's notebook, not a CRM: no charts, no scoring, no avatars. Search first
 * (any part of a number, any formatting), then Show chips and Sort. Phones get cards, the tablet two
 * columns of them, laptops a table, and from 1600px a customer opens in a split pane beside the list.
 */
export function AdminCustomers({ dict, list, filters, pane }: AdminCustomersProps) {
  const d = dict.customers
  const split = pane ? "split" : "single"
  const base = { ...filters, customer: null }
  const customers: BoardCustomer[] = list.rows.map((row) => ({
    ...row,
    links: { page: `/admin/customers/${row.id}`, pane: customersHref({ ...filters, customer: row.id }) },
    current: row.id === pane?.id,
  }))
  const notFound = looksLikeNumber(filters.q)

  const body =
    list.total === 0 ? (
      <EmptyState message={d.emptyAll} />
    ) : customers.length === 0 ? (
      <EmptyState
        message={
          <span className="flex flex-col gap-2">
            <span className="font-display text-h2 font-semibold text-foreground tabular-nums">
              {notFound ? fill(d.notFoundTitle, { q: filters.q }) : d.noMatchTitle}
            </span>
            <span>{notFound ? d.notFoundBody : d.noMatchBody}</span>
          </span>
        }
        action={
          <ButtonLink href={customersHref({ ...base, q: "", show: notFound ? filters.show : "all" })} variant="outlineLink" scroll={false}>
            {filters.q ? d.clearSearch : d.clearFilters}
          </ButtonLink>
        }
      />
    ) : (
      <CustomerBoard customers={customers} dict={dict} paneOpen={Boolean(pane)} />
    )

  return (
    <div className="flex flex-col">
      <CustomersHeader total={list.total} trusted={list.trusted} blocked={list.blocked} dict={d} />
      {list.total > 0 ? <CustomersFilterBar dict={d} filters={filters} paneOpen={Boolean(pane)} /> : null}

      <CustomerActionsProvider dict={dict.customerActions} autoVerifyTrusted={list.autoVerifyTrusted} statusPlacement="manual">
        <div className={`grid gap-6 px-4 pt-4 pb-12 md:px-6 lg:px-8 ${layouts[split]}`}>
          <div className={`flex min-w-0 flex-col gap-4 ${listSpans[split]}`}>
            <CustomerActionsStatus dict={dict.customerActions} />
            {body}
            {list.matched > customers.length ? (
              <p className="text-center text-small-admin text-muted tabular-nums">{fill(d.capped, { shown: customers.length, count: list.matched })}</p>
            ) : null}
          </div>

          {pane ? (
            <aside className="hidden min-w-0 overflow-hidden rounded-card border border-border bg-background 2xl:sticky 2xl:top-4 2xl:col-span-3 2xl:block 2xl:h-pane">
              <CustomerDetail key={pane.id} customer={pane} dict={dict} variant="pane" />
            </aside>
          ) : null}
        </div>
      </CustomerActionsProvider>
    </div>
  )
}
