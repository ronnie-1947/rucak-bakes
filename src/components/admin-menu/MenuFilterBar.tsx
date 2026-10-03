import { ChipLink } from "@/components/ui/ChipLink"
import { Container } from "@/components/ui/Container"
import { LinkSelect } from "@/components/ui/LinkSelect"
import { SearchBox } from "@/components/ui/SearchBox"
import { type MenuFilters, menuHref, sortChoices, statusChoices } from "@/lib/menu/filters"
import type { MenuCopy, ViewMode } from "./types"
import { ViewToggle } from "./ViewToggle"

type MenuFilterBarProps = {
  dict: MenuCopy
  filters: MenuFilters
  view: ViewMode
  categories: { slug: string; name: string }[]
}

/**
 * Sticky under the header: search and the List / Grid toggle, then one row of category chips, status
 * chips and the sort. On phones the chip row scrolls sideways instead of wrapping.
 */
export function MenuFilterBar({ dict, filters, view, categories }: MenuFilterBarProps) {
  const sortOptions = sortChoices.map((sort) => ({ value: sort, label: dict.sorts[sort], href: menuHref({ ...filters, sort }) }))

  return (
    <div className="sticky top-0 z-20 border-y border-border bg-background shadow-raised">
      <Container className="flex flex-col gap-2 py-3">
        <div className="flex items-center gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1 md:max-w-80">
            <SearchBox value={filters.q} baseHref={menuHref({ ...filters, q: "" })} label={dict.searchLabel} placeholder={dict.searchPlaceholder} />
          </div>
          {view === "auto" ? (
            <>
              <ViewToggle filters={filters} current="list" dict={dict} className="flex md:hidden" />
              <ViewToggle filters={filters} current="grid" dict={dict} className="hidden md:flex" />
            </>
          ) : (
            <ViewToggle filters={filters} current={view} dict={dict} className="flex" />
          )}
        </div>

        <div className="-mx-4 flex min-w-0 items-center gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          <ChipLink href={menuHref({ ...filters, cat: null })} selected={filters.cat === null}>
            {dict.allCategories}
          </ChipLink>
          {categories.map((category) => (
            <ChipLink key={category.slug} href={menuHref({ ...filters, cat: category.slug })} selected={filters.cat === category.slug}>
              {category.name}
            </ChipLink>
          ))}
          <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />
          {statusChoices.map((status) => (
            <ChipLink key={status} href={menuHref({ ...filters, status })} selected={filters.status === status}>
              {dict.statuses[status]}
            </ChipLink>
          ))}
          <LinkSelect value={filters.sort} options={sortOptions} label={dict.sortLabel} className="md:ml-auto" />
        </div>
      </Container>
    </div>
  )
}
