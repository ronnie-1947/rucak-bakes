import Link from "next/link"
import { buttonClasses } from "@/components/ui/Button"
import { ChipLink } from "@/components/ui/ChipLink"
import {
  CLEARED,
  datePresets,
  filtersHref,
  isDefault,
  type OrderFilters,
  showToggles,
  statusChoices,
  toggle,
} from "@/lib/orders/filters"
import { CustomDateChip } from "./CustomDateChip"
import { SearchBox } from "./SearchBox"
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

/**
 * Search plus three chip rows — Date, Status, Show — every chip a link to the next filter state.
 * Sticky under the header. On phones each row scrolls sideways instead of wrapping.
 */
export function OrdersFilterBar({ dict, filters, paneOpen }: OrdersFilterBarProps) {
  const base = { ...filters, order: null }
  const rowClass = "flex min-w-0 items-center gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
  const labelClass = "w-14 shrink-0 text-micro font-semibold text-muted uppercase"
  const presetDates = filters.dates.filter((date) => (datePresets as readonly string[]).includes(date))

  return (
    <div className={`z-20 border-y border-border bg-background shadow-raised ${sticking[paneOpen ? "open" : "closed"]}`}>
      <div className="flex flex-col gap-2 px-4 py-2 md:px-6 lg:px-8">
        <SearchBox filters={filters} label={dict.searchLabel} placeholder={dict.searchPlaceholder} />

        <div className={rowClass}>
          <span className={labelClass}>{dict.filters.date}</span>
          {datePresets.map((preset) => (
            <ChipLink
              key={preset}
              href={filtersHref({ ...base, dates: toggle(presetDates, preset, true) })}
              selected={filters.dates.includes(preset)}
            >
              {dict.filters.dates[preset]}
            </ChipLink>
          ))}
          <CustomDateChip filters={filters} label={dict.filters.customDate} />
        </div>

        <div className={rowClass}>
          <span className={labelClass}>{dict.filters.status}</span>
          {statusChoices.map((status) => (
            <ChipLink key={status} href={filtersHref({ ...base, status })} selected={filters.status === status}>
              {dict.filters.statuses[status]}
            </ChipLink>
          ))}
        </div>

        <div className={rowClass}>
          <span className={labelClass}>{dict.filters.show}</span>
          {showToggles.map((key) => (
            <ChipLink key={key} href={filtersHref({ ...base, show: toggle(filters.show, key) })} selected={filters.show.includes(key)}>
              {dict.filters.toggles[key]}
            </ChipLink>
          ))}
          {!isDefault(filters) ? (
            <Link href={filtersHref({ ...CLEARED, order: null, select: filters.select })} scroll={false} className={buttonClasses("link", "sm", "ml-auto shrink-0")}>
              {dict.filters.clear}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
