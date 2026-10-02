/**
 * `pnpm orders:sample` — local development only. Places a realistic spread of orders for today,
 * tomorrow and the day after through the REAL order pipeline (placeOrder + the lifecycle transitions),
 * so the admin screens have something to show. Needs the seed.
 *
 * Re-running is safe: every order has a fixed idempotency key, so a second run replays instead of
 * creating, and transitions that already happened are skipped.
 */
import { loadEnvConfig } from "@next/env"
import type { FulfilmentType } from "@/generated/prisma/enums"
import { addDays, todayIn, zonedTimeToUtc } from "@/lib/dates"

loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error })

type Step = "verify" | "ready" | "complete" | "cancel" | "noshow"

type Sample = {
  key: string
  /** 0 = today, 1 = tomorrow … */
  day: number
  name: string
  phone: string
  items: [slug: string, quantity: number][]
  type?: FulfilmentType
  address?: string
  pickupTime?: string
  note?: string
  steps?: Step[]
}

const SAMPLES: Sample[] = [
  { key: "s01", day: 0, name: "Meera Iyer", phone: "98201 44718", items: [["sourdough-loaf", 2], ["brownie-box", 1], ["butter-croissant", 1]], pickupTime: "11:30", note: "Nut allergy in the family — please keep the brownies away from the other bread." },
  { key: "s02", day: 0, name: "Rohan Mehta", phone: "98765 43210", items: [["multigrain-loaf", 1], ["butter-croissant", 2]], pickupTime: "10:00" },
  { key: "s03", day: 0, name: "Anita Rao", phone: "99001 23456", items: [["sourdough-loaf", 1]], pickupTime: "09:00", steps: ["verify"] },
  { key: "s04", day: 0, name: "Farah Khan", phone: "98450 11223", items: [["pain-au-chocolat", 4]], pickupTime: "08:30", note: "Please box them in two.", steps: ["verify"] },
  { key: "s05", day: 0, name: "Vikram Shah", phone: "97311 80045", items: [["multigrain-loaf", 1], ["butter-croissant", 3]], pickupTime: "08:00", steps: ["verify", "ready"] },
  { key: "s06", day: 0, name: "Leela George", phone: "99450 67781", items: [["sourdough-loaf", 2]], pickupTime: "07:30", steps: ["verify", "ready", "complete"] },
  { key: "s07", day: 0, name: "Kiran Rao", phone: "98440 22019", items: [["butter-croissant", 6]], pickupTime: "07:45", steps: ["verify", "ready", "complete"] },
  { key: "s08", day: 0, name: "Nikhil Jain", phone: "90080 33415", items: [["chicken-puff", 4]], pickupTime: "10:30", steps: ["cancel"] },
  { key: "s09", day: 0, name: "Divya Menon", phone: "98860 55012", items: [["chicken-puff", 6], ["brownie-box", 1]], pickupTime: "09:30", steps: ["verify", "ready", "noshow"] },
  { key: "s10", day: 1, name: "Sanjay Pillai", phone: "98451 90876", items: [["sourdough-loaf", 1], ["pain-au-chocolat", 2]], pickupTime: "09:30" },
  { key: "s11", day: 1, name: "Kavya Nair", phone: "99020 11873", items: [["multigrain-loaf", 1]], pickupTime: "10:30", steps: ["verify"] },
  { key: "s12", day: 1, name: "Priya Menon", phone: "97400 12398", items: [["butter-croissant", 2], ["chicken-puff", 2]], pickupTime: "08:00", note: "My son will collect.", steps: ["verify"] },
  { key: "s13", day: 1, name: "Meera Iyer", phone: "98201 44718", items: [["chicken-puff", 3]], pickupTime: "12:00" },
  { key: "s14", day: 2, name: "Anita Rao", phone: "99001 23456", items: [["brownie-box", 2]], pickupTime: "11:00" },
]

/** Customer flags set BEFORE ordering — a blocked number's orders are accepted and flagged. */
const TRUSTED = ["+919900123456", "+919945067781", "+919731180045"]
const BLOCKED = ["+919008033415"]
/** Collected orders from before this app existed, so "Ordered before (n)" has something to say. */
const HISTORY: Record<string, { completedCount: number; totalSpentPaise: number }> = {
  "+919820144718": { completedCount: 4, totalSpentPaise: 182000 },
  "+919900123456": { completedCount: 7, totalSpentPaise: 245000 },
  "+919945067781": { completedCount: 12, totalSpentPaise: 512000 },
  "+919731180045": { completedCount: 2, totalSpentPaise: 64000 },
  "+919008033415": { completedCount: 1, totalSpentPaise: 24000 },
}

async function main() {
  const { prisma, OrderError } = await import("@/lib/db")
  const { normalise } = await import("@/lib/phone")
  const { placeOrder } = await import("@/lib/orders/place")
  const lifecycle = await import("@/lib/orders/lifecycle")

  const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } })
  const owner = await prisma.staff.findFirstOrThrow({ where: { role: "OWNER", isActive: true }, orderBy: { createdAt: "asc" } })
  const today = todayIn(settings.timezone)
  const items = new Map((await prisma.menuItem.findMany({ select: { id: true, slug: true } })).map((item) => [item.slug, item.id]))

  for (const phone of [...TRUSTED, ...BLOCKED, ...Object.keys(HISTORY)]) {
    const sample = SAMPLES.find((s) => normalise(s.phone) === phone)
    if (!sample) continue
    await prisma.customer.upsert({
      where: { phoneE164: phone },
      create: { phoneE164: phone, name: sample.name, isTrusted: TRUSTED.includes(phone), isBlocked: BLOCKED.includes(phone), ...HISTORY[phone] },
      update: {},
    })
  }

  let created = 0
  for (const sample of SAMPLES) {
    const date = addDays(today, sample.day)
    const phoneE164 = normalise(sample.phone)
    if (!phoneE164) throw new Error(`Bad sample phone ${sample.phone}`)
    // "Placed" the morning before the fulfilment day, so today's orders clear their cutoff.
    const now = zonedTimeToUtc(addDays(date, -1), "10:00", settings.timezone)
    try {
      const order = await placeOrder(
        {
          idempotencyKey: `sample-${sample.key}`,
          fulfilmentDate: date,
          fulfilmentType: sample.type ?? "PICKUP",
          name: sample.name,
          phoneE164,
          address: sample.address ?? null,
          pickupTime: sample.pickupTime ?? null,
          note: sample.note ?? null,
          items: sample.items.map(([slug, quantity]) => {
            const id = items.get(slug)
            if (!id) throw new Error(`No menu item ${slug} — run the seed`)
            return { menuItemId: id, quantity }
          }),
        },
        { now },
      )
      if (order.created) created++

      for (const step of sample.steps ?? []) {
        try {
          if (step === "verify") await lifecycle.verifyOrder(order.id, owner.id, true)
          if (step === "ready") await lifecycle.markReady(order.id)
          if (step === "complete") await lifecycle.markCompleted(order.id)
          if (step === "cancel") await lifecycle.cancelOrder(order.id, owner.id, "Customer asked")
          if (step === "noshow") await lifecycle.markNoShow(order.id, owner.id, "Didn’t turn up")
        } catch (error) {
          if (!(error instanceof OrderError && error.code === "INVALID_TRANSITION")) throw error
        }
      }
    } catch (error) {
      if (error instanceof OrderError) {
        console.warn(`${sample.key} (${date}) refused: ${error.code}`, error.details)
        continue
      }
      throw error
    }
  }

  const count = await prisma.order.count()
  console.log(`Sample orders: ${created} created, ${count} in the database.`)
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
