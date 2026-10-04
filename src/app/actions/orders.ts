"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireStaff } from "@/auth"
import { OrderStatus } from "@/generated/prisma/enums"
import { formatDayLabel } from "@/lib/dates"
import { OrderError, prisma } from "@/lib/db"
import { cancelOrder, markCompleted, markNoShow, markReady, verifyOrder } from "@/lib/orders/lifecycle"
import { placeOrder } from "@/lib/orders/place"
import { type StaffOrderField, type StaffOrderInput, type StaffOrderResult, staffOrderSchema } from "@/lib/orders/staff-order"
import { normalise } from "@/lib/phone"

/** What the admin UI gets back from a status change — never a thrown error for a business refusal. */
export type TransitionResult =
  | { ok: true }
  /** Verifying would pass a day's maxOrders. `over` names each day so the confirm dialog can. */
  | { ok: false; reason: "CAPACITY_EXCEEDED"; over: { ids: string[]; codes: string[]; dayLabel: string; wouldBe: number; maxOrders: number }[] }
  /** Someone else moved these orders first — the screen refreshes and says which. */
  | { ok: false; reason: "STALE"; codes: string[] }
  | { ok: false; reason: "INVALID" }

const transitionInput = z.object({
  ids: z.array(z.string().min(1).max(40)).min(1).max(50),
  to: z.enum([OrderStatus.VERIFIED, OrderStatus.READY, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.NO_SHOW]),
  force: z.boolean().default(false),
  note: z.string().trim().max(200).nullable().default(null),
})

/**
 * Moves one or more orders to `to` — the list's status menu, the detail page's action bar and the bulk
 * bar all come here. Each order is its own transaction, so one refusal never undoes the others.
 * Cancel and no-show carry a reason (`note`); verify over capacity needs `force`.
 */
export async function transitionOrders(input: z.input<typeof transitionInput>): Promise<TransitionResult> {
  const staff = await requireStaff()
  const parsed = transitionInput.safeParse(input)
  if (!parsed.success) return { ok: false, reason: "INVALID" }
  const { ids, to, force, note } = parsed.data

  const orders = await prisma.order.findMany({ where: { id: { in: ids } }, select: { id: true, code: true } })
  const codeOf = new Map(orders.map((order) => [order.id, order.code]))
  const stale: string[] = []
  const over = new Map<string, { ids: string[]; codes: string[]; dayLabel: string; wouldBe: number; maxOrders: number }>()

  for (const id of ids) {
    const code = codeOf.get(id)
    if (!code) {
      stale.push(id)
      continue
    }
    try {
      if (to === OrderStatus.VERIFIED) await verifyOrder(id, staff.id, force)
      if (to === OrderStatus.READY) await markReady(id)
      if (to === OrderStatus.COMPLETED) await markCompleted(id)
      if (to === OrderStatus.CANCELLED) await cancelOrder(id, staff.id, note)
      if (to === OrderStatus.NO_SHOW) await markNoShow(id, staff.id, note)
    } catch (error) {
      if (!(error instanceof OrderError)) throw error
      if (error.code === "CAPACITY_EXCEEDED") {
        const date = String(error.details.date)
        const entry = over.get(date) ?? { ids: [], codes: [], dayLabel: formatDayLabel(date), wouldBe: Number(error.details.verifiedCount), maxOrders: Number(error.details.maxOrders) }
        entry.ids.push(id)
        entry.codes.push(code)
        entry.wouldBe += 1
        over.set(date, entry)
      } else {
        stale.push(code)
      }
    }
  }

  revalidatePath("/admin", "layout")
  if (over.size > 0) return { ok: false, reason: "CAPACITY_EXCEEDED", over: [...over.values()] }
  if (stale.length > 0) return { ok: false, reason: "STALE", codes: stale }
  return { ok: true }
}

const noteInput = z.object({ id: z.string().min(1).max(40), note: z.string().trim().max(1000) })

/** The team's note on an order. Empty clears it. */
export async function saveInternalNote(input: z.input<typeof noteInput>): Promise<{ ok: boolean }> {
  await requireStaff()
  const parsed = noteInput.safeParse(input)
  if (!parsed.success) return { ok: false }
  await prisma.order.update({ where: { id: parsed.data.id }, data: { internalNote: parsed.data.note || null } })
  revalidatePath(`/admin/orders/${parsed.data.id}`)
  revalidatePath("/admin/orders")
  return { ok: true }
}

const FIELDS: Record<string, StaffOrderField> = {
  phone: "phone",
  name: "name",
  items: "items",
  fulfilmentDate: "date",
  address: "address",
}

/**
 * /admin/orders/new (dev-docs/implementation.md 7R.5) — an order a customer gave staff by phone or at the counter. Verified
 * as it's added, by whoever adds it; priced as staff set it; allowed past the cutoff, the notice and the website's switches;
 * past a full day only with `allowFull`. One placeOrder transaction with the checkout, so the day is counted under one
 * lock. No rate limit and no Telegram — staff made it.
 */
export async function createStaffOrder(input: StaffOrderInput): Promise<StaffOrderResult> {
  const staff = await requireStaff()
  const parsed = staffOrderSchema.safeParse(input)
  if (!parsed.success) {
    const key = parsed.error.issues.map((issue) => String(issue.path[0])).find((path) => path in FIELDS)
    return { ok: false, reason: "INVALID", field: key ? FIELDS[key] : null }
  }
  const data = parsed.data
  const phoneE164 = normalise(data.phone)
  if (!phoneE164) return { ok: false, reason: "INVALID", field: "phone" }
  const delivery = data.fulfilmentType === "DELIVERY"
  if (delivery && !data.address) return { ok: false, reason: "INVALID", field: "address" }

  try {
    const placed = await placeOrder(
      {
        idempotencyKey: data.idempotencyKey,
        fulfilmentDate: data.fulfilmentDate,
        fulfilmentType: data.fulfilmentType,
        name: data.name,
        phoneE164,
        address: delivery ? data.address : null,
        pickupTime: delivery ? null : data.pickupTime,
        note: data.note || null,
        items: data.items,
      },
      { staff: { staffId: staff.id, allowFull: data.allowFull, deliveryFeePaise: data.deliveryFeePaise, internalNote: data.internalNote || null } },
    )
    revalidatePath("/admin", "layout")
    return { ok: true, id: placed.id, code: placed.code }
  } catch (error) {
    if (!(error instanceof OrderError)) throw error
    switch (error.code) {
      case "DAY_CLOSED":
      case "PAST_DATE":
        return { ok: false, reason: error.code, date: data.fulfilmentDate }
      case "ITEM_UNAVAILABLE":
        return {
          ok: false,
          reason: "ITEM_UNAVAILABLE",
          menuItemId: String(error.details.menuItemId),
          name: typeof error.details.name === "string" ? error.details.name : null,
        }
      case "DAY_FULL":
        return {
          ok: false,
          reason: "DAY_FULL",
          date: data.fulfilmentDate,
          liveCount: Number(error.details.liveCount),
          overbookLimit: Number(error.details.overbookLimit),
          verifiedCount: Number(error.details.verifiedCount),
          maxOrders: Number(error.details.maxOrders),
        }
      case "FULFILMENT_UNAVAILABLE":
        return { ok: false, reason: "INVALID", field: "address" }
      default:
        throw error
    }
  }
}
