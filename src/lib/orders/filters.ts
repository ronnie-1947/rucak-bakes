import { OrderStatus } from "@/generated/prisma/enums"
import { addDays, dateRange, type IsoDate, isIsoDate } from "@/lib/dates"

/**
 * The orders queue's filters, as they live in the URL — so a filtered view survives a refresh, the
 * back button, and being sent to a colleague. Client-safe: the filter chips are plain links built here.
 *
 *   ?date=today,tomorrow&status=PENDING&show=trusted,before&q=meera&order=<id>
 */

export const datePresets = ["today", "tomorrow", "week"] as const
export type DatePreset = (typeof datePresets)[number]
export type DateChoice = DatePreset | IsoDate

export const showToggles = ["trusted", "before", "call"] as const
export type ShowToggle = (typeof showToggles)[number]

export const statusChoices = ["ALL", OrderStatus.PENDING, OrderStatus.VERIFIED, OrderStatus.READY, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.NO_SHOW] as const
export type StatusChoice = (typeof statusChoices)[number]

export type OrderFilters = {
  dates: DateChoice[]
  status: StatusChoice
  show: ShowToggle[]
  q: string
  /** The order open in the split pane (2xl). Not a filter, but carried through every filter link. */
  order: string | null
  /** Bulk-selection mode — checkboxes on every order and the Verify all / Cancel all bar. */
  select: boolean
}

export const DEFAULT_DATES: DateChoice[] = ["today", "tomorrow"]

type Params = Record<string, string | string[] | undefined>

function list(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "")
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
}

export function parseFilters(params: Params): OrderFilters {
  const dates = list(params.date).filter((d): d is DateChoice => (datePresets as readonly string[]).includes(d) || isIsoDate(d))
  const status = (statusChoices as readonly string[]).includes(String(params.status)) ? (params.status as StatusChoice) : "ALL"
  const show = list(params.show).filter((s): s is ShowToggle => (showToggles as readonly string[]).includes(s))
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim().slice(0, 80) ?? ""
  const order = (Array.isArray(params.order) ? params.order[0] : params.order) || null
  const select = params.select === "1"
  return { dates: dates.length > 0 ? [...new Set(dates)] : DEFAULT_DATES, status, show: [...new Set(show)], q, order, select }
}

export function isDefault(filters: OrderFilters): boolean {
  const sameDates = filters.dates.length === DEFAULT_DATES.length && DEFAULT_DATES.every((d) => filters.dates.includes(d))
  return sameDates && filters.status === "ALL" && filters.show.length === 0 && !filters.q
}

/** The URL for a filter state. Defaults are left out, so the bare /admin/orders is the default view. */
export function filtersHref(filters: OrderFilters, path = "/admin/orders"): string {
  const params = new URLSearchParams()
  const sameDates = filters.dates.length === DEFAULT_DATES.length && DEFAULT_DATES.every((d) => filters.dates.includes(d))
  if (!sameDates) params.set("date", filters.dates.join(","))
  if (filters.status !== "ALL") params.set("status", filters.status)
  if (filters.show.length > 0) params.set("show", filters.show.join(","))
  if (filters.q) params.set("q", filters.q)
  if (filters.order) params.set("order", filters.order)
  if (filters.select) params.set("select", "1")
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

/** Toggle one entry of a list, never leaving the date list empty. */
export function toggle<T>(values: T[], value: T, keepOne = false): T[] {
  const next = values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
  return keepOne && next.length === 0 ? values : next
}

export const CLEARED: Omit<OrderFilters, "order" | "select"> = { dates: DEFAULT_DATES, status: "ALL", show: [], q: "" }

/** The calendar dates a filter selects, given today in the bakery's timezone. */
export function selectedDates(dates: DateChoice[], today: IsoDate): IsoDate[] {
  const out = new Set<IsoDate>()
  for (const choice of dates) {
    if (choice === "today") out.add(today)
    else if (choice === "tomorrow") out.add(addDays(today, 1))
    else if (choice === "week") dateRange(today, addDays(today, 6)).forEach((d) => out.add(d))
    else out.add(choice)
  }
  return [...out].sort()
}
