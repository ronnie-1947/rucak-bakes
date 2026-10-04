import Link from "next/link"
import { buttonClasses } from "@/components/ui/Button"
import { CLEARED, filtersHref, isDefault, type OrderFilters, showToggles, statusChoices } from "@/lib/orders/filters"
import { DateFilter } from "./DateFilter"
import { FilterSelect } from "./FilterSelect"
import type { OrdersCopy } from "./types"

type OrdersFilterBarProps = {
  dict: OrdersCopy
  filters: OrderFilters
  /** The 2xl split pane is open: the bar stops sticking there, so the pane can stick instead. */
  paneOpen: boolean
}

const sticking: Record<"open" | "closed", string> = {
  open: "sticky top-0 2xl:static",
  closed: "sticky top-0",
}

/** Phones share the row three ways; from 768px each select is 180px. */
const selectWidth = "flex-1 md:w-45 md:flex-none"

/** The value the Show select takes when no toggle is on. */
const ANY = "any"

/**
 * Date, Status, Show as three labelled selects in one row, and Clear once anything narrows the list. Sticky under the
 * header at a fixed 82px (`h-20.5`) — the day headers stick right under it (`top-20.5`), so change both together.
 */
export function OrdersFilterBar({ dict, filters, paneOpen }: OrdersFilterBarProps) {
  const base = { ...filters, order: null }
  const f = dict.filters

  return (
    <div className={`z-20 h-20.5 border-y border-border bg-background shadow-raised ${sticking[paneOpen ? "open" : "closed"]}`}>
      <div className="flex h-full min-w-0 items-end gap-2 px-4 py-2 md:px-6 lg:px-8">
        <DateFilter filters={filters} dict={f} className={selectWidth} />
        <FilterSelect
          label={f.status}
          value={filters.status}
          options={statusChoices.map((status) => ({ value: status, label: f.statuses[status], href: filtersHref({ ...base, status }) }))}
          active={filters.status !== "ALL"}
          className={selectWidth}
        />
        <FilterSelect
          label={f.show}
          value={filters.show[0] ?? ANY}
          options={[
            { value: ANY, label: f.showAll, href: filtersHref({ ...base, show: [] }) },
            ...showToggles.map((key) => ({ value: key, label: f.toggles[key], href: filtersHref({ ...base, show: [key] }) })),
          ]}
          active={filters.show.length > 0}
          className={selectWidth}
        />
        {!isDefault(filters) ? (
          <Link href={filtersHref({ ...CLEARED, order: null, select: filters.select })} scroll={false} className={buttonClasses("link", "inline", "shrink-0 px-1")}>
            <span className="md:hidden">{f.clearShort}</span>
            <span className="hidden md:inline">{f.clear}</span>
          </Link>
        ) : null}
      </div>
    </div>
  )
}
