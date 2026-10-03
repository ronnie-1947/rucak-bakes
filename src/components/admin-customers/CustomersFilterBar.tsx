import { ChipLink } from "@/components/ui/ChipLink"
import { LinkSelect } from "@/components/ui/LinkSelect"
import { SearchBox } from "@/components/ui/SearchBox"
import { type CustomerFilters, customersHref, showChoices, sortChoices } from "@/lib/customers/filters"
import type { CustomersCopy } from "./types"

type CustomersFilterBarProps = {
  dict: CustomersCopy
  filters: CustomerFilters
  /** The 2xl split pane is open: the bar stops sticking there, so the pane can stick instead. */
  paneOpen: boolean
}

const sticking: Record<"open" | "closed", string> = {
  open: "sticky top-0 2xl:static",
  closed: "sticky top-0",
}

/**
 * Search is the point of the screen: full width, never collapsed, matching any part of a number however
 * it's typed. Under it the Show chips and Sort. Sticky under the header; chips scroll sideways on phones.
 */
export function CustomersFilterBar({ dict, filters, paneOpen }: CustomersFilterBarProps) {
  const base = { ...filters, customer: null }
  const sortOptions = sortChoices.map((sort) => ({ value: sort, label: dict.sorts[sort], href: customersHref({ ...base, sort }) }))

  return (
    <div className={`z-20 border-y border-border bg-background shadow-raised ${sticking[paneOpen ? "open" : "closed"]}`}>
      <div className="flex flex-col gap-2 px-4 py-3 md:px-6 lg:flex-row lg:items-start lg:gap-4 lg:px-8">
        <div className="min-w-0 lg:flex-1 lg:basis-80">
          <SearchBox
            value={filters.q}
            baseHref={customersHref({ ...base, q: "" })}
            label={dict.searchLabel}
            placeholder={dict.searchPlaceholder}
            clearLabel={dict.clearSearch}
            hint={dict.searchHint}
          />
        </div>
        <div
          role="group"
          aria-label={dict.showLabel}
          className="-mx-4 flex min-w-0 items-center gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        >
          {showChoices.map((show) => (
            <ChipLink key={show} href={customersHref({ ...base, show })} selected={filters.show === show}>
              {dict.shows[show]}
            </ChipLink>
          ))}
          <LinkSelect value={filters.sort} options={sortOptions} label={dict.sortLabel} />
        </div>
      </div>
    </div>
  )
}
