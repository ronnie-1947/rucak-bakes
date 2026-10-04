import Link from "next/link"
import { buttonClasses } from "@/components/ui/Button"
import { SearchBox } from "@/components/ui/SearchBox"
import { filtersHref, type OrderFilters } from "@/lib/orders/filters"
import type { CapacityData } from "@/lib/orders/queries"
import { CapacityMeters } from "./CapacityMeters"
import { SearchToggle } from "./SearchToggle"
import type { OrdersCopy } from "./types"

type OrdersHeaderProps = {
  dict: OrdersCopy
  capacity: CapacityData[]
  filters: OrderFilters
}

/**
 * Title, today / tomorrow capacity (beside the title from 768px, below it on phones), Select / Done, then the search —
 * always from 768px; on phones behind the search button (SearchToggle), or open when a search is in the URL.
 */
export function OrdersHeader({ dict, capacity, filters }: OrdersHeaderProps) {
  return (
    <div className="group/search flex flex-col gap-3 px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1">{dict.title}</h1>
        <div className="flex items-center gap-6">
          <CapacityMeters capacity={capacity} dict={dict} className="hidden md:flex" />
          <div className="flex items-center gap-2">
            <SearchToggle label={dict.searchLabel} open={Boolean(filters.q)} />
            <Link href={filtersHref({ ...filters, select: !filters.select })} scroll={false} className={buttonClasses("link", "sm")}>
              {filters.select ? dict.done : dict.select}
            </Link>
          </div>
        </div>
      </div>
      <CapacityMeters capacity={capacity} dict={dict} className="md:hidden" />
      <div className="hidden group-has-checked/search:block md:block">
        <SearchBox
          value={filters.q}
          baseHref={filtersHref({ ...filters, order: null, q: "" })}
          label={dict.searchLabel}
          placeholder={dict.searchPlaceholder}
        />
      </div>
    </div>
  )
}
