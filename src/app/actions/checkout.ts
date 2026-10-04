"use server"

import { headers } from "next/headers"
import { after } from "next/server"
import { z } from "zod"
import { OrderError, prisma } from "@/lib/db"
import type { CartCheck } from "@/lib/cart/check"
import { checkoutSchema, type CheckoutInput, type CheckoutResult, mergeLines } from "@/lib/orders/checkout"
import { notifyNewOrder } from "@/lib/orders/notify"
import { placeOrder } from "@/lib/orders/place"
import { ipLimited, phoneLimited } from "@/lib/orders/rate-limit"
import { normalise } from "@/lib/phone"
import { checkLines } from "@/lib/storefront/cart"

/**
 * The customer's two server actions — no sign-in, so every input is parsed here and nothing the browser sends is
 * trusted beyond its shape: prices, names and notices all come from the database.
 */

const checkInput = z.object({
  ids: z.array(z.string().min(1).max(40)).min(1).max(40),
})

/**
 * The cart's lines against the menu, with the booking window — the cart page runs this on mount and when moving day.
 * Null for a malformed request.
 */
export async function checkCart(input: z.input<typeof checkInput>): Promise<CartCheck | null> {
  const parsed = checkInput.safeParse(input)
  if (!parsed.success) return null
  return checkLines([...new Set(parsed.data.ids)])
}

/**
 * dev-docs/implementation.md 7.1–7.3: parse, normalise the phone, merge duplicate lines, rate-limit, then
 * placeOrder's one transaction. The owner hears about it after the response (`after`), and a Telegram failure
 * never touches the order. A blocked customer gets an ordinary answer — the order is only flagged.
 */
export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) {
    const field = parsed.error.issues.map((issue) => issue.path[0]).find((key) => key === "name" || key === "phone" || key === "address")
    return { ok: false, reason: "INVALID", field: field ?? null }
  }
  const data = parsed.data
  const phoneE164 = normalise(data.phone)
  if (!phoneE164) return { ok: false, reason: "INVALID", field: "phone" }
  if (data.fulfilmentType === "DELIVERY" && !data.address) return { ok: false, reason: "INVALID", field: "address" }

  const head = await headers()
  // A resend of an order that went through is answered with that order, whatever the limits now say.
  const replay = await prisma.order.findUnique({ where: { idempotencyKey: data.idempotencyKey }, select: { id: true } })
  if (!replay) {
    const ip = head.get("x-forwarded-for")?.split(",")[0].trim() || head.get("x-real-ip") || null
    if (ipLimited(ip) || (await phoneLimited(phoneE164))) return { ok: false, reason: "RATE_LIMITED" }
  }

  try {
    const placed = await placeOrder({
      idempotencyKey: data.idempotencyKey,
      fulfilmentDate: data.fulfilmentDate,
      fulfilmentType: data.fulfilmentType,
      name: data.name,
      phoneE164,
      address: data.fulfilmentType === "DELIVERY" ? data.address : null,
      pickupTime: null,
      note: data.note || null,
      items: mergeLines(data.items),
    })

    const origin = `${head.get("x-forwarded-proto") ?? "https"}://${head.get("x-forwarded-host") ?? head.get("host")}`
    after(() => notifyNewOrder(placed, origin))

    return {
      ok: true,
      order: {
        code: placed.code,
        phone: placed.customerPhone,
        date: placed.fulfilmentDate,
        type: placed.fulfilmentType,
        address: data.fulfilmentType === "DELIVERY" ? data.address : null,
        items: placed.items,
        deliveryFeePaise: placed.totalPaise - placed.items.reduce((sum, item) => sum + item.lineTotalPaise, 0),
        totalPaise: placed.totalPaise,
        note: placed.customerNote,
      },
    }
  } catch (error) {
    if (!(error instanceof OrderError)) throw error
    switch (error.code) {
      case "DAY_FULL":
      case "DAY_CLOSED":
      case "CUTOFF_PASSED":
        return { ok: false, reason: error.code, date: data.fulfilmentDate }
      case "TOO_SOON":
        return {
          ok: false,
          reason: "TOO_SOON",
          date: data.fulfilmentDate,
          name: typeof error.details.name === "string" ? error.details.name : null,
          notice: Number(error.details.notice) || 0,
          earliest: typeof error.details.earliest === "string" ? error.details.earliest : null,
        }
      case "ITEM_UNAVAILABLE":
        return {
          ok: false,
          reason: "ITEM_UNAVAILABLE",
          menuItemId: String(error.details.menuItemId),
          name: typeof error.details.name === "string" ? error.details.name : null,
        }
      case "ORDERING_PAUSED":
        return {
          ok: false,
          reason: "ORDERING_PAUSED",
          message: typeof error.details.reason === "string" ? error.details.reason.trim() || null : null,
        }
      case "FULFILMENT_UNAVAILABLE":
        return { ok: false, reason: "FULFILMENT_UNAVAILABLE" }
      default:
        throw error
    }
  }
}
