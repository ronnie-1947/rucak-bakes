import { z } from "zod"

/**
 * Who ordered last time on this device — `localStorage['bakery.customer']` (dev-docs/implementation.md 6.3) — so
 * the details step comes back filled in. Written only after an order goes through. Browser-only at call time;
 * storage can be missing or throw, and then the form simply starts empty.
 */

const CUSTOMER_KEY = "bakery.customer"

const customerSchema = z.object({
  name: z.string().max(80),
  /** As typed — the national number, "98765 43210". */
  phone: z.string().max(20),
  address: z.string().max(300).optional(),
  note: z.string().max(500).optional(),
})

export type SavedCustomer = z.infer<typeof customerSchema>

export function readCustomer(): SavedCustomer | null {
  try {
    const raw = window.localStorage.getItem(CUSTOMER_KEY)
    if (!raw) return null
    const parsed = customerSchema.safeParse(JSON.parse(raw))
    return parsed.success && parsed.data.name && parsed.data.phone ? parsed.data : null
  } catch {
    return null
  }
}

export function saveCustomer(customer: SavedCustomer) {
  try {
    window.localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer))
  } catch {
    // Storage unavailable — next time the form starts empty.
  }
}
