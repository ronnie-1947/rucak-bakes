/**
 * The menu library's view state, as it lives in the URL — so a filtered view survives a refresh and the
 * back button. Client-safe: every chip is a plain link built here.
 *
 *   ?q=rye&cat=breads&status=inactive&sort=recent&view=list&archived=1&select=1
 */

export const statusChoices = ["all", "active", "inactive"] as const
export type StatusChoice = (typeof statusChoices)[number]

export const sortChoices = ["name", "recent", "ordered", "price"] as const
export type SortChoice = (typeof sortChoices)[number]

/** List or grid. Unset (`null`) lets the width decide: a list on phones, a grid from 768px. */
export const viewChoices = ["list", "grid"] as const
export type ViewChoice = (typeof viewChoices)[number]

export type MenuFilters = {
  q: string
  /** A MenuCategory slug; null is "All". */
  cat: string | null
  status: StatusChoice
  sort: SortChoice
  view: ViewChoice | null
  /** The archived view replaces the list. */
  archived: boolean
  /** Bulk-selection mode — checkboxes on every item and the Activate / Deactivate / Archive bar. */
  select: boolean
}

type Params = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? ""
}

function oneOf<T extends string>(choices: readonly T[], value: string, fallback: T): T {
  return (choices as readonly string[]).includes(value) ? (value as T) : fallback
}

export function parseMenuFilters(params: Params): MenuFilters {
  const view = first(params.view)
  return {
    q: first(params.q).trim().slice(0, 80),
    cat: first(params.cat).trim().slice(0, 60) || null,
    status: oneOf(statusChoices, first(params.status), "all"),
    sort: oneOf(sortChoices, first(params.sort), "name"),
    view: (viewChoices as readonly string[]).includes(view) ? (view as ViewChoice) : null,
    archived: first(params.archived) === "1",
    select: first(params.select) === "1",
  }
}

/** Search, category or status narrows the list. Sort and view don't. */
export function isFiltered(filters: MenuFilters): boolean {
  return Boolean(filters.q) || filters.cat !== null || filters.status !== "all"
}

export const CLEARED: Pick<MenuFilters, "q" | "cat" | "status"> = { q: "", cat: null, status: "all" }

/** The URL for a view state. Defaults are left out, so the bare /admin/menu is the default view. */
export function menuHref(filters: MenuFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  if (filters.cat) params.set("cat", filters.cat)
  if (filters.status !== "all") params.set("status", filters.status)
  if (filters.sort !== "name") params.set("sort", filters.sort)
  if (filters.view) params.set("view", filters.view)
  if (filters.archived) params.set("archived", "1")
  if (filters.select) params.set("select", "1")
  const query = params.toString()
  return query ? `/admin/menu?${query}` : "/admin/menu"
}
