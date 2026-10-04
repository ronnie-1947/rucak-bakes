import { PrismaPg } from "@prisma/adapter-pg"
import { withAccelerate } from "@prisma/extension-accelerate"
import { Prisma, PrismaClient } from "@/generated/prisma/client"

/** The client an interactive transaction hands its callback. */
export type Tx = Prisma.TransactionClient

/**
 * Prisma 7 picks its driver from the URL scheme:
 * - prisma:// or prisma+postgres:// — Prisma Postgres through Accelerate (driver adapters reject these URLs)
 * - postgres:// or postgresql:// — direct TCP: the local Docker database, or Prisma Postgres' TCP string
 *
 * Accelerate's extension only goes on the Accelerate client: on an adapter client it would start the
 * engine at import time. Nothing here uses `cacheStrategy`, so both are typed as the base client.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set — see .env.example")
  if (url.startsWith("prisma://") || url.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: url }).$extends(withAccelerate()) as unknown as PrismaClient
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
}

/** Stashed on globalThis so dev hot reloads reuse one connection pool instead of opening another per edit. */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

/**
 * Runs `fn` in a SERIALIZABLE transaction, retrying serialization conflicts.
 *
 * A Postgres 40001 is EXPECTED under concurrency, not an error: retry it, never surface it.
 * The pg driver adapter reports 40001 and deadlocks (40P01) as P2034.
 */
export async function serializable<T>(fn: (tx: Tx) => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 15_000,
      })
    } catch (error) {
      const isConflict =
        error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2034" || (error.meta?.code as string) === "40001")
      if (!isConflict || attempt === retries) throw error
      await new Promise((r) => setTimeout(r, 25 * 2 ** attempt + Math.random() * 25))
    }
  }
  throw new Error("unreachable")
}

/**
 * Runs `fn` in a READ COMMITTED transaction — for writes that a row lock (`SELECT … FOR UPDATE`) serializes, not the
 * isolation level. Each statement reads what is committed when it runs, so a transaction that waited for the lock sees
 * everything the holder wrote. Under SERIALIZABLE the waiter keeps its first statement's snapshot, reads a stale count
 * and aborts; with 20 orders at once the retries ran out (CHECKPOINT 7b), so placeOrder and verifyOrder take the day's
 * lock here instead.
 *
 * Retries a deadlock (P2034) and a lost insert race (P2002 — the same idempotency key or a new customer's number from two
 * requests at once): the next attempt reads the winner's row.
 */
export async function readCommitted<T>(fn: (tx: Tx) => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 5_000,
        timeout: 15_000,
      })
    } catch (error) {
      const isRace = error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2034" || error.code === "P2002")
      if (!isRace || attempt === retries) throw error
      await new Promise((r) => setTimeout(r, 25 * 2 ** attempt + Math.random() * 25))
    }
  }
  throw new Error("unreachable")
}

export type OrderErrorCode =
  | "DAY_CLOSED"
  /** A staff order for a date gone by — customers get CUTOFF_PASSED for the same thing (7R.5). */
  | "PAST_DATE"
  | "CUTOFF_PASSED"
  /** The lines' notice puts the deadline before now, though the day's own cutoff hasn't passed (§10R). */
  | "TOO_SOON"
  | "DAY_FULL"
  | "ITEM_UNAVAILABLE"
  | "ORDERING_PAUSED"
  | "FULFILMENT_UNAVAILABLE"
  | "CAPACITY_EXCEEDED"
  | "INVALID_TRANSITION"

/**
 * A business-rule refusal, carrying a machine-readable code. Thrown inside a transaction so it
 * rolls back; caught at the server-action boundary and mapped to what the customer or staff sees.
 * `details` carries what that mapping needs — the item that can't be ordered, the owner's pause reason.
 */
export class OrderError extends Error {
  readonly code: OrderErrorCode
  readonly details: Record<string, unknown>

  constructor(code: OrderErrorCode, details: Record<string, unknown> = {}) {
    super(code)
    this.name = "OrderError"
    this.code = code
    this.details = details
  }
}
