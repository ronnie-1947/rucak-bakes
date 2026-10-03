import { Prisma } from "@/generated/prisma/client"
import { type CustomerFilters, phoneDigits, type ShowChoice, type SortChoice } from "@/lib/customers/filters"
import { addDays, formatShortDate, isoDateInZone, todayIn, zonedTimeToUtc } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { formatForDisplay } from "@/lib/phone"
import { getSettings } from "@/lib/settings/row"

/** Read model for the customers list (/admin/customers). */

export type CustomerFlags = { isTrusted: boolean; isBlocked: boolean; isNew: boolean }

export type CustomerRow = CustomerFlags & {
  id: string
  name: string
  phoneE164: string
  /** "+91 98765 43210" */
  phoneDisplay: string
  orderCount: number
  noShowCount: number
  /** "3 Oct" — the day of their latest order, bakery time. */
  lastOrderLabel: string | null
  /** The item on most of their orders. */
  usual: string | null
}

export type CustomerList = {
  rows: CustomerRow[]
  /** Every customer, and how many are trusted / blocked — the line under the title. */
  total: number
  trusted: number
  blocked: number
  /** Customers matching the search and filter; `rows` stops at LIST_LIMIT. */
  matched: number
  /** Settings.autoVerifyTrusted — what marking someone trusted actually does. */
  autoVerifyTrusted: boolean
}

/** A shopkeeper's notebook, not a CRM: past this, search is the way in. */
export const LIST_LIMIT = 100

/** A first order in the last week earns the "New" tag. */
const NEW_DAYS = 7

/** LIKE treats % and _ as wildcards and \ as the escape — a typed one is just a character. */
function likeContains(text: string): string {
  return `%${text.replace(/[\\%_]/g, "\\$&")}%`
}

/**
 * Customers whose number contains the typed digits (any formatting — "98765 43210", "+91-98765…") or whose
 * name contains the typed text. Both conditions are the shapes the trigram indexes cover:
 * customers_phone_trgm on "phoneE164", customers_name_trgm on lower("name").
 */
async function searchIds(q: string): Promise<string[]> {
  const digits = phoneDigits(q)
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM customers
    WHERE (${digits}::text <> '' AND "phoneE164" LIKE ${likeContains(digits)})
       OR lower("name") LIKE ${likeContains(q.toLowerCase())}`
  return rows.map((row) => row.id)
}

/** The first instant of the bakery's current month. */
function monthStart(timezone: string): Date {
  return zonedTimeToUtc(`${todayIn(timezone).slice(0, 7)}-01`, "00:00", timezone)
}

function showWhere(show: ShowChoice, timezone: string): Prisma.CustomerWhereInput {
  if (show === "trusted") return { isTrusted: true }
  if (show === "blocked") return { isBlocked: true }
  if (show === "before") return { orderCount: { gte: 2 } }
  if (show === "noshow") return { noShowCount: { gt: 0 } }
  if (show === "new") return { firstOrderAt: { gte: monthStart(timezone) } }
  return {}
}

const orderBy: Record<SortChoice, Prisma.CustomerOrderByWithRelationInput[]> = {
  recent: [{ lastOrderAt: { sort: "desc", nulls: "last" } }, { orderCount: "desc" }, { name: "asc" }],
  most: [{ orderCount: "desc" }, { lastOrderAt: { sort: "desc", nulls: "last" } }, { name: "asc" }],
  name: [{ name: "asc" }],
}

/** Each customer's most-ordered item, on orders that weren't cancelled or missed. */
export async function usualItems(customerIds: string[]): Promise<Map<string, string>> {
  if (customerIds.length === 0) return new Map()
  const rows = await prisma.$queryRaw<{ customerId: string; name: string }[]>`
    SELECT DISTINCT ON (o."customerId") o."customerId", oi."name"
    FROM order_items oi JOIN orders o ON o.id = oi."orderId"
    WHERE o."customerId" IN (${Prisma.join(customerIds)}) AND o.status NOT IN ('CANCELLED', 'NO_SHOW')
    GROUP BY o."customerId", oi."name"
    ORDER BY o."customerId", COUNT(*) DESC, oi."name"`
  return new Map(rows.map((row) => [row.customerId, row.name]))
}

/** Whether a first order counts as new — within the last week, bakery time. */
export function isNewCustomer(firstOrderAt: Date | null, timezone: string): boolean {
  if (!firstOrderAt) return false
  return isoDateInZone(firstOrderAt, timezone) > addDays(todayIn(timezone), -NEW_DAYS)
}

export async function loadCustomerList(filters: CustomerFilters): Promise<CustomerList> {
  const settings = await getSettings()
  const ids = filters.q ? await searchIds(filters.q) : null
  const where: Prisma.CustomerWhereInput = { ...showWhere(filters.show, settings.timezone), ...(ids ? { id: { in: ids } } : {}) }

  const [customers, matched, total, trusted, blocked] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: orderBy[filters.sort],
      take: LIST_LIMIT,
      select: {
        id: true,
        name: true,
        phoneE164: true,
        isTrusted: true,
        isBlocked: true,
        orderCount: true,
        noShowCount: true,
        firstOrderAt: true,
        lastOrderAt: true,
      },
    }),
    prisma.customer.count({ where }),
    prisma.customer.count(),
    prisma.customer.count({ where: { isTrusted: true } }),
    prisma.customer.count({ where: { isBlocked: true } }),
  ])
  const usual = await usualItems(customers.map((customer) => customer.id))

  return {
    rows: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phoneE164: customer.phoneE164,
      phoneDisplay: formatForDisplay(customer.phoneE164),
      isTrusted: customer.isTrusted,
      isBlocked: customer.isBlocked,
      isNew: isNewCustomer(customer.firstOrderAt, settings.timezone),
      orderCount: customer.orderCount,
      noShowCount: customer.noShowCount,
      lastOrderLabel: customer.lastOrderAt ? formatShortDate(isoDateInZone(customer.lastOrderAt, settings.timezone)) : null,
      usual: usual.get(customer.id) ?? null,
    })),
    total,
    trusted,
    blocked,
    matched,
    autoVerifyTrusted: settings.autoVerifyTrusted,
  }
}
