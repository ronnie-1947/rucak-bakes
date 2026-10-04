/**
 * `pnpm orders:race` — local development only. CHECKPOINT 7b (dev-docs/implementation.md §10): races the real order
 * pipeline against one day's limits, three ways —
 *
 *   1. the same idempotency key sent DUPLICATES times at once → one order, every answer that same order
 *   2. RACERS orders at once at a day with room for ROOM more → exactly ROOM placed, the rest DAY_FULL
 *   3. every pending order from 1 and 2 verified at once, with room for VERIFY_ROOM → exactly that many verified, the rest
 *      CAPACITY_EXCEEDED
 *
 * More than the room means the day lock is wrong; fewer, or errors instead of refusals, means a transaction gave up under
 * contention. Uses the last day of the booking window, opened for the run. Afterwards it deletes the orders it placed (keys
 * `race-…`) and the customers it created, and puts the day back as it found it.
 */
import { loadEnvConfig } from "@next/env"
import { addDays, todayIn, toDbDate } from "@/lib/dates"

loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error })

const DUPLICATES = 5
const RACERS = 20
const ROOM = 15
const VERIFY_ROOM = 10

type Outcome<T> = { ok: T[]; refused: Map<string, number>; errors: string[] }

async function main() {
  const { prisma, OrderError } = await import("@/lib/db")
  const { placeOrder } = await import("@/lib/orders/place")
  const { verifyOrder } = await import("@/lib/orders/lifecycle")
  const { newMenuDay } = await import("@/lib/orders/booking")
  const { LIVE_STATUSES, VERIFIED_STATUSES } = await import("@/lib/orders/status")

  /** Sorts settled results into successes, refusals by code, and anything else. */
  function tally<T>(results: PromiseSettledResult<T>[]): Outcome<T> {
    const outcome: Outcome<T> = { ok: [], refused: new Map(), errors: [] }
    for (const result of results) {
      if (result.status === "fulfilled") outcome.ok.push(result.value)
      else if (result.reason instanceof OrderError) outcome.refused.set(result.reason.code, (outcome.refused.get(result.reason.code) ?? 0) + 1)
      else {
        const error = result.reason as Error & { code?: string }
        outcome.errors.push(`${error.name} ${error.code ?? ""}: ${String(error.message).trim().split("\n").filter(Boolean).at(-1)}`)
      }
    }
    return outcome
  }

  function report(label: string, outcome: Outcome<unknown>, ms: number) {
    const refused = [...outcome.refused].map(([code, n]) => `${code} ×${n}`).join(", ") || "none"
    console.log(`${label}: ${outcome.ok.length} through, refused ${refused} — ${ms}ms`)
    if (outcome.errors.length > 0) console.log(`  errors (${outcome.errors.length}):\n    ${[...new Set(outcome.errors)].join("\n    ")}`)
  }

  async function timed<T>(work: () => Promise<PromiseSettledResult<T>[]>): Promise<[Outcome<T>, number]> {
    const started = performance.now()
    const outcome = tally(await work())
    return [outcome, Math.round(performance.now() - started)]
  }

  const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } })
  const owner = await prisma.staff.findFirstOrThrow({ where: { role: "OWNER", isActive: true }, orderBy: { createdAt: "asc" } })
  const date = addDays(todayIn(settings.timezone), settings.orderAheadDays)
  const item = await prisma.menuItem.findFirst({
    where: { isActive: true, archivedAt: null, orderable: true, noticeDays: { lte: 1 } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
  if (!item) throw new Error("No orderable item with 1 day's notice or less — run the seed")

  const existed = (await prisma.menuDay.findUnique({ where: { date: toDbDate(date) } })) !== null
  await prisma.menuDay.createMany({ data: [newMenuDay(date, settings)], skipDuplicates: true })
  const day = await prisma.menuDay.findUniqueOrThrow({ where: { date: toDbDate(date) } })
  const live = await prisma.order.count({ where: { menuDayId: day.id, status: { in: [...LIVE_STATUSES] } } })
  const verifiedBefore = await prisma.order.count({ where: { menuDayId: day.id, status: { in: [...VERIFIED_STATUSES] } } })
  // Room for the duplicate's one order plus ROOM racers; maxOrders leaves room for VERIFY_ROOM verifies (CHECK: ≤ overbook).
  const overbookLimit = live + 1 + ROOM
  const maxOrders = verifiedBefore + VERIFY_ROOM
  await prisma.menuDay.update({ where: { id: day.id }, data: { isOpen: true, overbookLimit, maxOrders } })

  const run = Date.now().toString(36)
  const phones = Array.from({ length: RACERS + 1 }, (_, i) => `+9198000${String(41000 + i).padStart(5, "0")}`)
  const known = new Set(
    (await prisma.customer.findMany({ where: { phoneE164: { in: phones } }, select: { phoneE164: true } })).map((customer) => customer.phoneE164),
  )
  const order = (key: string, phoneE164: string, name: string) =>
    placeOrder({
      idempotencyKey: `race-${run}-${key}`,
      fulfilmentDate: date,
      fulfilmentType: "PICKUP",
      name,
      phoneE164,
      address: null,
      pickupTime: null,
      note: null,
      items: [{ menuItemId: item.id, quantity: 1 }],
    })

  console.log(`${date}, ${item.name}: ${live} live / ${verifiedBefore} verified before; overbook ${overbookLimit}, max ${maxOrders} for the run.`)

  // 1. A double-tap, five times over.
  const [dup, dupMs] = await timed(() => Promise.allSettled(Array.from({ length: DUPLICATES }, () => order("dup", phones[RACERS], "Race double-tap"))))
  report(`1. Same key ×${DUPLICATES}`, dup, dupMs)
  const dupPass =
    dup.ok.length === DUPLICATES && dup.ok.filter((placed) => placed.created).length === 1 && new Set(dup.ok.map((placed) => placed.id)).size === 1

  // 2. The rush.
  const [rush, rushMs] = await timed(() => Promise.allSettled(phones.slice(0, RACERS).map((phone, i) => order(String(i), phone, `Race ${i + 1}`))))
  report(`2. ${RACERS} orders, room for ${ROOM}`, rush, rushMs)
  const liveAfter = await prisma.order.count({ where: { menuDayId: day.id, status: { in: [...LIVE_STATUSES] } } })
  const rushPass = rush.ok.length === ROOM && rush.refused.get("DAY_FULL") === RACERS - ROOM && rush.errors.length === 0 && liveAfter === overbookLimit

  // 3. Everyone taps Verify at once.
  const pending = await prisma.order.findMany({ where: { idempotencyKey: { startsWith: `race-${run}-` }, status: "PENDING" }, select: { id: true } })
  const [verify, verifyMs] = await timed(() => Promise.allSettled(pending.map((row) => verifyOrder(row.id, owner.id))))
  report(`3. Verify ${pending.length}, room for ${VERIFY_ROOM}`, verify, verifyMs)
  const verifiedAfter = await prisma.order.count({ where: { menuDayId: day.id, status: { in: [...VERIFIED_STATUSES] } } })
  const verifyPass =
    verify.ok.length === Math.min(VERIFY_ROOM, pending.length) &&
    (verify.refused.get("CAPACITY_EXCEEDED") ?? 0) === Math.max(0, pending.length - VERIFY_ROOM) &&
    verify.errors.length === 0 &&
    verifiedAfter === Math.min(maxOrders, verifiedBefore + pending.length)

  // Put everything back.
  await prisma.order.deleteMany({ where: { idempotencyKey: { startsWith: `race-${run}-` } } })
  await prisma.customer.deleteMany({ where: { phoneE164: { in: phones.filter((phone) => !known.has(phone)) }, orders: { none: {} } } })
  if (existed) {
    await prisma.menuDay.update({ where: { id: day.id }, data: { isOpen: day.isOpen, overbookLimit: day.overbookLimit, maxOrders: day.maxOrders } })
  } else {
    await prisma.menuDay.delete({ where: { id: day.id } })
  }

  const pass = dupPass && rushPass && verifyPass
  console.log(pass ? "PASS" : `FAIL — duplicates ${dupPass ? "ok" : "FAIL"}, rush ${rushPass ? "ok" : "FAIL"}, verify ${verifyPass ? "ok" : "FAIL"}`)
  await prisma.$disconnect()
  if (!pass) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
