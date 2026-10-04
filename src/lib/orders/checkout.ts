import { z } from "zod"
import { isIsoDate, type IsoDate } from "@/lib/dates"
import { MAX_LINE_QTY } from "@/lib/cart/cart"
import { normalise } from "@/lib/phone"

/**
 * The customer's checkout: what the cart's details step sends (`createOrder`, actions/checkout.ts) and every
 * answer it can get back (dev-docs/implementation.md 7.2). Client-safe — the form checks the same rules
 * before it sends, so the server's refusal is only ever the backstop.
 */

export const NAME_MAX = 80
export const ADDRESS_MAX = 300
export const NOTE_MAX = 500

export const checkoutSchema = z.object({
  idempotencyKey: z.uuid(),
  fulfilmentDate: z.string().refine(isIsoDate),
  fulfilmentType: z.enum(["PICKUP", "DELIVERY"]),
  name: z.string().trim().min(1).max(NAME_MAX),
  /** As typed; normalised to E.164 on the server. */
  phone: z.string().trim().min(1).max(20),
  address: z.string().trim().max(ADDRESS_MAX).nullable(),
  note: z.string().trim().max(NOTE_MAX).nullable(),
  /** Display prices never travel: the server prices the order. */
  items: z
    .array(z.object({ menuItemId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(MAX_LINE_QTY) }))
    .min(1)
    .max(40),
})

export type CheckoutInput = z.input<typeof checkoutSchema>

/** The order as it was placed — the confirmed screen shows this, never the cart's own idea of it. */
export type PlacedSummary = {
  code: string
  /** E.164 — shown back so the customer can spot a typo. */
  phone: string
  date: IsoDate
  type: "PICKUP" | "DELIVERY"
  address: string | null
  items: { name: string; quantity: number; lineTotalPaise: number }[]
  deliveryFeePaise: number
  totalPaise: number
  note: string | null
}

export type CheckoutRefusal =
  | { reason: "DAY_FULL" | "DAY_CLOSED" | "CUTOFF_PASSED"; date: IsoDate }
  | { reason: "ITEM_UNAVAILABLE"; menuItemId: string; name: string | null; remaining: number }
  | { reason: "ORDERING_PAUSED"; message: string | null }
  | { reason: "FULFILMENT_UNAVAILABLE" }
  | { reason: "RATE_LIMITED" }
  /** The form's own rules, failed on the server — `field` when it's one the customer can fix. */
  | { reason: "INVALID"; field: DetailsField | null }

export type CheckoutResult = ({ ok: true } & { order: PlacedSummary }) | ({ ok: false } & CheckoutRefusal)

export type DetailsField = "name" | "phone" | "address"

export type DetailsValues = { name: string; phone: string; type: "PICKUP" | "DELIVERY"; address: string }

/** The fields the customer must fix before the order can go — empty when it can. */
export function detailsProblems(values: DetailsValues): DetailsField[] {
  const problems: DetailsField[] = []
  if (!values.name.trim()) problems.push("name")
  if (!normalise(values.phone)) problems.push("phone")
  if (values.type === "DELIVERY" && !values.address.trim()) problems.push("address")
  return problems
}

/** One line per item — two Adds of the same thing become one quantity. */
export function mergeLines(items: { menuItemId: string; quantity: number }[]): { menuItemId: string; quantity: number }[] {
  const merged = new Map<string, number>()
  for (const item of items) merged.set(item.menuItemId, (merged.get(item.menuItemId) ?? 0) + item.quantity)
  return [...merged].map(([menuItemId, quantity]) => ({ menuItemId, quantity }))
}
