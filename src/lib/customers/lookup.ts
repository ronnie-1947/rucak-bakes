import { parsePhoneNumberFromString } from "libphonenumber-js"
import type { Prisma } from "@/generated/prisma/client"
import { type CustomerFlags, isNewCustomer } from "@/lib/customers/queries"
import { formatShortDate, isoDateInZone } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { typedPhone } from "@/lib/orders/staff-order"
import { getSettings } from "@/lib/settings/row"

/**
 * One customer as the staff order form shows them under the phone field (7R.5): who they are, how they stand, and their
 * saved address. Found by exact number (`findCustomerByPhone`) or by id (`/admin/orders/new?customer=`). Trigram search
 * stays on /admin/customers.
 */
export type CustomerLookup = {
  id: string
  name: string
  /** "98765 43210" — the form's own spelling, behind its fixed +91. */
  phone: string
  flags: CustomerFlags
  /** Collected orders — "Ordered before (6)". */
  completedCount: number
  /** "21 Sep" — when they last ordered, bakery time. */
  lastOrderLabel: string | null
  /** Kept from their last delivery order. */
  address: string | null
}

export async function lookupCustomer(where: Prisma.CustomerWhereUniqueInput): Promise<CustomerLookup | null> {
  const [customer, settings] = await Promise.all([prisma.customer.findUnique({ where }), getSettings()])
  if (!customer) return null
  const national = parsePhoneNumberFromString(customer.phoneE164)?.nationalNumber ?? customer.phoneE164
  return {
    id: customer.id,
    name: customer.name,
    phone: typedPhone(national),
    flags: { isTrusted: customer.isTrusted, isBlocked: customer.isBlocked, isNew: isNewCustomer(customer.firstOrderAt, settings.timezone) },
    completedCount: customer.completedCount,
    lastOrderLabel: customer.lastOrderAt ? formatShortDate(isoDateInZone(customer.lastOrderAt, settings.timezone)) : null,
    address: customer.address,
  }
}
