import { buttonClasses } from "@/components/ui/Button"
import { type OrderFilters, filtersHref } from "@/lib/orders/filters"
import type { CapacityData } from "@/lib/orders/queries"
import Link from "next/link"
import { CapacityMeters } from "./CapacityMeters"
import type { OrdersCopy } from "./types"

type OrdersHeaderProps = {
  dict: OrdersCopy
  capacity: CapacityData[]
  filters: OrderFilters
}

/** Title, today/tomorrow capacity (beside the title from 768px, below it on phones), Select / Done. */
export function OrdersHeader({ dict, capacity, filters }: OrdersHeaderProps) {
  return (
    <div className="flex flex-col gap-3 px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1">{dict.title}</h1>
        <div className="flex items-center gap-6">
          <CapacityMeters capacity={capacity} dict={dict} className="hidden md:flex" />
          <Link href={filtersHref({ ...filters, select: !filters.select })} scroll={false} className={buttonClasses("link", "sm")}>
            {filters.select ? dict.done : dict.select}
          </Link>
        </div>
      </div>
      <CapacityMeters capacity={capacity} dict={dict} className="md:hidden" />
    </div>
  )
}
