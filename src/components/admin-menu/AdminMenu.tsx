import { MenuActionsProvider } from "@/components/menu-actions/MenuActionsProvider"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { Container } from "@/components/ui/Container"
import { EmptyState } from "@/components/ui/EmptyState"
import { CLEARED, isFiltered, type MenuFilters, menuHref } from "@/lib/menu/filters"
import type { MenuLibrary } from "@/lib/menu/queries"
import { fill } from "@/lib/template"
import { AddFab } from "./AddFab"
import { ArchivedList } from "./ArchivedList"
import { MenuBoard } from "./MenuBoard"
import { MenuFilterBar } from "./MenuFilterBar"
import { MenuHeader } from "./MenuHeader"
import type { AdminCopy } from "./types"

type AdminMenuProps = {
  dict: AdminCopy
  library: MenuLibrary
  filters: MenuFilters
}

/**
 * /admin/menu — the library of everything the bakery can make. Search, category and status chips, an
 * inline Active switch, bulk select, and the archived view. What's on sale on a given day is the
 * Calendar's job; the header says so.
 */
export function AdminMenu({ dict, library, filters }: AdminMenuProps) {
  const d = dict.menu
  const empty = library.totalCount === 0
  const showControls = !filters.archived && !empty

  const body = filters.archived ? (
    <ArchivedList items={library.archived} dict={d} />
  ) : empty ? (
    <EmptyState
      message={d.emptyAll}
      action={
        <ButtonLink href="/admin/menu/new" variant="primary">
          {d.addFirst}
        </ButtonLink>
      }
    />
  ) : library.items.length === 0 ? (
    <EmptyState
      message={filters.q ? fill(d.emptySearch, { q: filters.q }) : d.emptyFilters}
      action={
        isFiltered(filters) ? (
          <ButtonLink href={menuHref({ ...filters, ...CLEARED })} variant="outlineLink" scroll={false}>
            {d.clear}
          </ButtonLink>
        ) : null
      }
    />
  ) : (
    <MenuBoard
      dict={dict}
      items={library.items}
      view={filters.view ?? "auto"}
      selectMode={filters.select}
      exitSelectHref={menuHref({ ...filters, select: false })}
    />
  )

  return (
    <div className="flex min-h-full flex-col">
      <MenuHeader
        dict={d}
        filters={filters}
        totalCount={library.totalCount}
        activeCount={library.activeCount}
        archivedCount={library.archivedCount}
      />
      {showControls ? <MenuFilterBar dict={d} filters={filters} view={filters.view ?? "auto"} categories={library.categories} /> : null}
      <Container className="flex flex-1 flex-col gap-4 pt-4 pb-12">
        <MenuActionsProvider dict={d}>{body}</MenuActionsProvider>
      </Container>
      {!filters.archived && !filters.select && !empty ? <AddFab label={d.add} /> : null}
    </div>
  )
}
