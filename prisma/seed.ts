/**
 * `pnpm exec prisma db seed` — dev-docs/implementation.md, Step 1.4.
 *
 * Every write is an upsert that leaves existing rows alone, so re-running is safe and never
 * clobbers what the owner has edited since.
 *
 * `pnpm exec prisma db seed -- --bare` writes only the settings row and the owners — for production.
 */
import { loadEnvConfig } from "@next/env"
import type { PrismaClient } from "@/generated/prisma/client"
import { addDays, computeCutoffAt, todayIn, toDbDate } from "@/lib/dates"

loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error })

// The bakery's menu — transcribed from the owner's handwritten list (dev-docs/menu.md).
const CATEGORIES = [
  { name: "Cakes", slug: "cakes" },
  { name: "Bento cakes", slug: "bento-cakes" },
  { name: "Pastries", slug: "pastries" },
  { name: "Muffins", slug: "muffins" },
  { name: "Custards", slug: "custards" },
  { name: "Ladoos", slug: "ladoos" },
  { name: "Custom cakes", slug: "custom-cakes" },
]

type SeedItem = {
  slug: string
  name: string
  shortDescription: string
  about?: string
  category: string
  basePricePaise: number
  priceUnit: "EACH" | "PER_BOX" | "PER_KG" | "PER_SLICE"
  sizeNote?: string
  ingredients: string[]
  allergens: string[]
  defaultQuantity: number
  /** Days' notice before pickup (schema default 1). */
  noticeDays?: number
  /** false = call only: on the menu with a Call button, never ordered online. */
  orderable?: boolean
  /** The day sheet's Made to order rows — one per order line, with the customer's note. */
  bakeSeparately?: boolean
}

/** One category's flavours at their list prices (₹). Descriptions, ingredients and allergens are the owner's to fill in. */
function flavours(
  category: string,
  suffix: string,
  rows: [flavour: string, rupees: number][],
  rest: Pick<SeedItem, "priceUnit" | "defaultQuantity" | "sizeNote" | "bakeSeparately">,
): SeedItem[] {
  return rows.map(([flavour, rupees]) => {
    const name = `${flavour} ${suffix}`
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    return { slug, name, shortDescription: "", category, basePricePaise: rupees * 100, ingredients: [], allergens: [], ...rest }
  })
}

const ITEMS: SeedItem[] = [
  // Priced per half kg — ordering one is half a kilo.
  ...flavours(
    "cakes",
    "cake",
    [
      ["Chocolate", 600],
      ["Vanilla", 500],
      ["Butterscotch", 500],
      ["Rasmalai", 500],
      ["Pineapple", 500],
      ["Strawberry", 500],
      ["Mango", 500],
      ["Orange", 500],
      ["Black Forest", 500],
      ["White Forest", 500],
    ],
    { priceUnit: "EACH", sizeNote: "Half kg", defaultQuantity: 1, bakeSeparately: true },
  ),
  ...flavours(
    "bento-cakes",
    "bento cake",
    [
      ["Chocolate", 250],
      ["Strawberry", 250],
      ["Vanilla", 250],
      ["Butterscotch", 250],
      ["Mango", 250],
      ["Orange", 250],
    ],
    { priceUnit: "EACH", defaultQuantity: 1, bakeSeparately: true },
  ),
  ...flavours(
    "pastries",
    "pastry",
    [
      ["Chocolate", 50],
      ["Vanilla", 40],
      ["Butterscotch", 40],
      ["Black Forest", 40],
      ["Cheese", 50],
    ],
    { priceUnit: "EACH", defaultQuantity: 12 },
  ),
  ...flavours(
    "muffins",
    "muffin",
    [
      ["Chocolate", 40],
      ["Vanilla", 40],
      ["Strawberry", 40],
      ["Pineapple", 40],
    ],
    { priceUnit: "EACH", defaultQuantity: 12 },
  ),
  ...flavours(
    "custards",
    "custard",
    [
      ["Apple", 60],
      ["Grape", 60],
      ["Strawberry", 60],
      ["Cherry", 60],
      ["Mango", 60],
      ["Mixed fruit", 60],
    ],
    { priceUnit: "EACH", defaultQuantity: 10 },
  ),
  ...flavours(
    "ladoos",
    "ladoo",
    [
      ["Besan", 50],
      ["Coconut", 50],
      ["Sesame", 50],
      ["Rice flour", 50],
    ],
    { priceUnit: "PER_BOX", defaultQuantity: 10 },
  ),
  // No fixed price: 0 reads "Price on request" — the price is agreed on the phone.
  {
    slug: "custom-cake",
    name: "Custom cake",
    shortDescription: "",
    category: "custom-cakes",
    basePricePaise: 0,
    priceUnit: "EACH",
    ingredients: [],
    allergens: [],
    defaultQuantity: 1,
    orderable: false,
    bakeSeparately: true,
  },
]

/** SEED_OWNERS="Name <email>, Name <email>" — a bare email works too. */
function parseOwners(raw: string | undefined): { name: string; email: string }[] {
  if (!raw?.trim()) throw new Error("SEED_OWNERS is not set — see .env.example")

  const owners = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = /^(.*?)\s*<([^<>]+)>$/.exec(entry)
      const email = (match ? match[2] : entry).trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`SEED_OWNERS: "${entry}" is not an email address`)
      return { name: match?.[1].trim() || email.split("@")[0], email }
    })

  // Google-only sign-in has no password reset: the second owner is the only way back in.
  if (new Set(owners.map((owner) => owner.email)).size < 2) {
    throw new Error("SEED_OWNERS needs two different owner emails — the second is the only way back in if the first account is lost")
  }
  return owners
}

async function seed(prisma: PrismaClient) {
  const owners = parseOwners(process.env.SEED_OWNERS)

  // Every transaction reads this row — without it nothing works.
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, bakeryName: "Sabiha Bakery", tagline: "Bread, pastries and cakes, baked every morning." },
  })

  for (const owner of owners) {
    await prisma.staff.upsert({
      where: { email: owner.email },
      update: { role: "OWNER", isActive: true },
      create: { email: owner.email, name: owner.name, role: "OWNER" },
    })
  }

  // `prisma db seed -- --bare` — production: settings and owners only, the owner builds the menu
  if (process.argv.includes("--bare")) {
    console.log(`Seeded (bare): settings ✓, ${await prisma.staff.count({ where: { role: "OWNER" } })} owners`)
    return
  }

  for (const [sortOrder, category] of CATEGORIES.entries()) {
    await prisma.menuCategory.upsert({ where: { slug: category.slug }, update: {}, create: { ...category, sortOrder } })
  }

  // Menu items only — the owner plans each day's counter-items in the Calendar.
  for (const item of ITEMS) {
    await prisma.menuItem.upsert({ where: { slug: item.slug }, update: {}, create: item })
  }

  const today = todayIn(settings.timezone)
  for (let offset = 0; offset < 7; offset++) {
    const date = addDays(today, offset)
    await prisma.menuDay.upsert({
      where: { date: toDbDate(date) },
      update: {},
      create: {
        date: toDbDate(date),
        cutoffAt: computeCutoffAt(date, settings.defaultCutoffTime, settings.defaultCutoffDays, settings.timezone),
        cutoffTime: settings.defaultCutoffTime,
        cutoffDaysBefore: settings.defaultCutoffDays,
        maxOrders: settings.defaultMaxOrders,
        overbookLimit: settings.defaultOverbook,
      },
    })
  }

  const [staff, categories, menuItems, menuDays] = await Promise.all([
    prisma.staff.count({ where: { role: "OWNER" } }),
    prisma.menuCategory.count(),
    prisma.menuItem.count(),
    prisma.menuDay.count(),
  ])
  console.log(`Seeded: settings ✓, ${staff} owners, ${categories} categories, ${menuItems} items, ${menuDays} days`)
}

async function main() {
  // Imported after loadEnvConfig: db.ts reads DATABASE_URL as it loads.
  const { prisma } = await import("@/lib/db")
  try {
    await seed(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
