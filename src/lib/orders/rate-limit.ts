import { prisma } from "@/lib/db"

/**
 * dev-docs/implementation.md 7.3 — checked BEFORE the order's transaction opens, so a flood never takes the
 * day's lock. Server-only.
 *
 * By phone: the orders table is the record (5 an hour), so it holds across every server instance.
 * By IP: a sliding window in this instance's memory — on Vercel each instance keeps its own, so it slows a
 * single client hammering one instance rather than enforcing a global number. Generous, because Indian mobile
 * networks put many customers behind one carrier IP.
 */

const HOUR_MS = 60 * 60 * 1000
export const PHONE_LIMIT = 5
const IP_LIMIT = 30

const recent = new Map<string, number[]>()

export async function phoneLimited(phoneE164: string, now = new Date()): Promise<boolean> {
  const placed = await prisma.order.count({ where: { customerPhone: phoneE164, createdAt: { gt: new Date(now.getTime() - HOUR_MS) } } })
  return placed >= PHONE_LIMIT
}

/** Counts this attempt too. Null (no address known) is never limited. */
export function ipLimited(ip: string | null, now = Date.now()): boolean {
  if (!ip) return false
  const since = now - HOUR_MS
  const hits = (recent.get(ip) ?? []).filter((at) => at > since)
  hits.push(now)
  recent.set(ip, hits)
  // Keep the map from growing without bound: forget addresses that have gone quiet.
  if (recent.size > 5_000) {
    for (const [key, times] of recent) if (times.every((at) => at <= since)) recent.delete(key)
  }
  return hits.length > IP_LIMIT
}
