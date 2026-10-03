import { prisma } from "@/lib/db"

/**
 * Writes behind the customer screens. Nothing here deletes a customer (non-negotiable 7) — a number
 * that shouldn't order is blocked, and a blocked number still orders, flagged (non-negotiable 8).
 */

export type FlagChange = "trust" | "untrust" | "block" | "unblock"

/** The flags before a change — exactly what Undo puts back. */
export type FlagSnapshot = { id: string; isTrusted: boolean; isBlocked: boolean }

export type FlagOutcome = { ok: true; undo: FlagSnapshot } | { ok: false; reason: "NOT_FOUND" | "CONFLICT" }

/**
 * Trusted and blocked are mutually exclusive (a CHECK, c_trust_exclusive): trusting a blocked number, or
 * blocking a trusted one, is refused — the owner takes the other flag off first, on purpose.
 */
export async function changeFlag(id: string, change: FlagChange): Promise<FlagOutcome> {
  const customer = await prisma.customer.findUnique({ where: { id }, select: { id: true, isTrusted: true, isBlocked: true } })
  if (!customer) return { ok: false, reason: "NOT_FOUND" }
  if ((change === "trust" && customer.isBlocked) || (change === "block" && customer.isTrusted)) return { ok: false, reason: "CONFLICT" }

  const data = change === "trust" || change === "untrust" ? { isTrusted: change === "trust" } : { isBlocked: change === "block" }
  // Guarded on the flags read above, so a change made meanwhile on another screen isn't overwritten.
  const updated = await prisma.customer.updateMany({ where: { id, isTrusted: customer.isTrusted, isBlocked: customer.isBlocked }, data })
  if (updated.count === 0) return { ok: false, reason: "CONFLICT" }
  return { ok: true, undo: customer }
}

export async function restoreFlags(snapshot: FlagSnapshot): Promise<boolean> {
  if (snapshot.isTrusted && snapshot.isBlocked) return false
  const updated = await prisma.customer.updateMany({ where: { id: snapshot.id }, data: { isTrusted: snapshot.isTrusted, isBlocked: snapshot.isBlocked } })
  return updated.count === 1
}

/** The name staff know them by. Past orders keep the name they were placed under (a snapshot). */
export async function renameCustomer(id: string, name: string): Promise<boolean> {
  const updated = await prisma.customer.updateMany({ where: { id }, data: { name } })
  return updated.count === 1
}

export async function saveCustomerNote(id: string, note: string): Promise<boolean> {
  const updated = await prisma.customer.updateMany({ where: { id }, data: { internalNote: note || null } })
  return updated.count === 1
}
