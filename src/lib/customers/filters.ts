/**
 * The customers list's view state, as it lives in the URL — a search survives refresh and back, and every
 * chip is a plain link. Client-safe.
 *
 *   ?q=98765&show=trusted&sort=most&customer=<id>
 */

export const showChoices = ["all", "trusted", "before", "new", "noshow", "blocked"] as const
export type ShowChoice = (typeof showChoices)[number]

export const sortChoices = ["recent", "most", "name"] as const
export type SortChoice = (typeof sortChoices)[number]

export type CustomerFilters = {
  q: string
  show: ShowChoice
  sort: SortChoice
  /** The customer open in the 2xl split pane. Not a filter, but carried through every link. */
  customer: string | null
}

type Params = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function parseCustomerFilters(params: Params): CustomerFilters {
  const show = first(params.show)
  const sort = first(params.sort)
  return {
    q: first(params.q)?.trim().slice(0, 80) ?? "",
    show: (showChoices as readonly string[]).includes(show ?? "") ? (show as ShowChoice) : "all",
    sort: (sortChoices as readonly string[]).includes(sort ?? "") ? (sort as SortChoice) : "recent",
    customer: first(params.customer)?.slice(0, 40) || null,
  }
}

/** The URL for a view state. Defaults are left out, so the bare /admin/customers is the default view. */
export function customersHref(filters: CustomerFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  if (filters.show !== "all") params.set("show", filters.show)
  if (filters.sort !== "recent") params.set("sort", filters.sort)
  if (filters.customer) params.set("customer", filters.customer)
  const query = params.toString()
  return query ? `/admin/customers?${query}` : "/admin/customers"
}

export function isFiltered(filters: CustomerFilters): boolean {
  return Boolean(filters.q) || filters.show !== "all"
}

/**
 * The digits a search matches phone numbers on — formatting dropped, and a leading trunk 0 ("09876…")
 * too, since numbers are stored as E.164 (+919876…). Under two digits it isn't a number search.
 */
export function phoneDigits(q: string): string {
  const digits = q.replace(/\D/g, "").replace(/^0+/, "")
  return digits.length >= 2 ? digits : ""
}

/** A search that looks like a phone number — an empty result then means "this number hasn't ordered before". */
export function looksLikeNumber(q: string): boolean {
  return phoneDigits(q).length >= 5 && !/[a-z]/i.test(q)
}
