import type { StaffRole } from "@/generated/prisma/client"
import { prisma, serializable } from "@/lib/db"
import type { OpeningHours } from "./hours"

/**
 * Every write behind the settings screen — already validated by the actions in src/app/actions/settings.ts.
 * The settings row is a singleton (id 1, a CHECK); staff are never deleted, only made inactive.
 */

const ROW = { id: 1 }

export type BakeryRecord = {
  bakeryName: string
  tagline: string | null
  /** E.164, or null to hide it. */
  publicPhone: string | null
  pickupAddress: string | null
  openingHours: OpeningHours
}

export async function saveBakery(record: BakeryRecord): Promise<void> {
  await prisma.settings.update({ where: ROW, data: record })
}

export type OrderingRecord = {
  defaultMaxOrders: number
  defaultOverbook: number
  defaultCutoffTime: string
  defaultCutoffDays: number
  orderAheadDays: number
  pickupEnabled: boolean
  deliveryEnabled: boolean
  deliveryRadiusKm: number
  deliveryFeePaise: number
}

/** New defaults only — days already planned keep their own cutoff and capacity. */
export async function saveOrdering(record: OrderingRecord): Promise<void> {
  await prisma.settings.update({ where: ROW, data: record })
}

export type AppearanceRecord = { heroImage: string | null; announcement: string | null }

/** Returns the photo this replaced, if any — the caller destroys it once nothing points at it. */
export async function saveAppearance(record: AppearanceRecord): Promise<string | null> {
  const before = await prisma.settings.findUniqueOrThrow({ where: ROW, select: { heroImage: true } })
  await prisma.settings.update({ where: ROW, data: record })
  return before.heroImage && before.heroImage !== record.heroImage ? before.heroImage : null
}

export async function setAutoVerify(on: boolean): Promise<void> {
  await prisma.settings.update({ where: ROW, data: { autoVerifyTrusted: on } })
}

/** Pausing needs the reason customers will see; resuming keeps it, ready for next time. */
export async function setPaused(paused: true, reason: string): Promise<void>
export async function setPaused(paused: false): Promise<void>
export async function setPaused(paused: boolean, reason?: string): Promise<void> {
  await prisma.settings.update({ where: ROW, data: paused ? { orderingPaused: true, orderingPausedReason: reason } : { orderingPaused: false } })
}

/** A freshly connected chat starts with a clean delivery record. */
export async function connectChat(chatId: string): Promise<void> {
  await prisma.settings.update({
    where: ROW,
    data: { telegramChatId: chatId, telegramConnectedAt: new Date(), telegramLastSentAt: null, telegramFailedAt: null, telegramError: null },
  })
}

export async function disconnectChat(): Promise<void> {
  await prisma.settings.update({
    where: ROW,
    data: { telegramChatId: null, telegramConnectedAt: null, telegramLastSentAt: null, telegramFailedAt: null, telegramError: null },
  })
}

// ── Staff ───────────────────────────────────────────────────────────────────

export type AddStaffOutcome = { ok: true; restored: boolean } | { ok: false; reason: "EXISTS" }

/**
 * Puts a Google address on the sign-in allowlist. Someone removed earlier comes back with the new name and
 * role; someone who already has access is refused, so a typo can't silently change a role.
 */
export async function addStaff(name: string, email: string, role: StaffRole): Promise<AddStaffOutcome> {
  const existing = await prisma.staff.findUnique({ where: { email }, select: { id: true, isActive: true } })
  if (existing?.isActive) return { ok: false, reason: "EXISTS" }
  if (existing) {
    await prisma.staff.update({ where: { id: existing.id }, data: { name, role, isActive: true } })
    return { ok: true, restored: true }
  }
  await prisma.staff.create({ data: { name, email, role } })
  return { ok: true, restored: false }
}

export type RemoveStaffOutcome = { ok: true; name: string } | { ok: false; reason: "SELF" | "LAST_OWNER" | "NOT_FOUND" }

/**
 * Takes someone off the allowlist. They're signed out on their next request — requireStaff() checks
 * `isActive` every time. Serializable, so two owners removing each other can't leave the bakery with none.
 */
export async function removeStaff(id: string, removedById: string): Promise<RemoveStaffOutcome> {
  if (id === removedById) return { ok: false, reason: "SELF" }
  return serializable(async (tx) => {
    const person = await tx.staff.findUnique({ where: { id }, select: { name: true, role: true, isActive: true } })
    if (!person?.isActive) return { ok: false, reason: "NOT_FOUND" } as const
    if (person.role === "OWNER") {
      const owners = await tx.staff.count({ where: { role: "OWNER", isActive: true } })
      if (owners <= 1) return { ok: false, reason: "LAST_OWNER" } as const
    }
    await tx.staff.update({ where: { id }, data: { isActive: false } })
    return { ok: true, name: person.name } as const
  })
}
