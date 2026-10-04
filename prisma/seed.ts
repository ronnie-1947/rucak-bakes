/**
 * `pnpm exec prisma db seed` — dev-docs/implementation.md, Step 1.4.
 *
 * Every write is an upsert that leaves existing rows alone, so re-running is safe and never
 * clobbers what the owner has edited since.
 */
import { loadEnvConfig } from "@next/env"
import type { PrismaClient } from "@/generated/prisma/client"
import { addDays, computeCutoffAt, todayIn, toDbDate, weekday } from "@/lib/dates"

loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error })

const CATEGORIES = [
  { name: "Breads", slug: "breads" },
  { name: "Pastries", slug: "pastries" },
  { name: "Cakes", slug: "cakes" },
  { name: "Savoury", slug: "savoury" },
  { name: "Seasonal", slug: "seasonal" },
]

const SAT = 6
const SUN = 0
const FRI = 5
const WED = 3

type SeedItem = {
  slug: string
  name: string
  shortDescription: string
  about?: string
  category: string
  basePricePaise: number
  priceUnit: "EACH" | "PER_BOX" | "PER_KG" | "PER_SLICE"
  ingredients: string[]
  allergens: string[]
  defaultQuantity: number
  /** Days' notice before pickup (schema default 1). */
  noticeDays?: number
  /** false = call only: on the menu with a Call button, never ordered online. */
  orderable?: boolean
  /** The day sheet's Made to order rows — one per order line, with the customer's note. */
  bakeSeparately?: boolean
  /** Weekdays it's a counter-item (0 = Sunday). Omitted = every day; [] = never. */
  days?: number[]
  /** A one-weekday price, to exercise MenuDayItem.priceOverridePaise. */
  override?: { day: number; pricePaise: number }
}

const ITEMS: SeedItem[] = [
  {
    slug: "sourdough-loaf",
    name: "Sourdough loaf",
    shortDescription: "Slow-fermented country loaf with a crackly crust.",
    about: "Made with our own starter and fermented for 24 hours. Keeps three days in a paper bag — refresh it in a hot oven.",
    category: "breads",
    basePricePaise: 24000,
    priceUnit: "EACH",
    ingredients: ["Wheat flour", "Water", "Sourdough starter", "Salt"],
    allergens: ["GLUTEN"],
    defaultQuantity: 12,
    override: { day: WED, pricePaise: 22000 },
  },
  {
    slug: "multigrain-loaf",
    name: "Multigrain sandwich loaf",
    shortDescription: "Soft sandwich loaf with oats, flax and sunflower seeds.",
    category: "breads",
    basePricePaise: 16000,
    priceUnit: "EACH",
    ingredients: ["Whole wheat flour", "Wheat flour", "Oats", "Flax seeds", "Sunflower seeds", "Sesame seeds", "Yeast", "Salt"],
    allergens: ["GLUTEN", "SESAME"],
    defaultQuantity: 10,
  },
  {
    slug: "butter-croissant",
    name: "Butter croissant",
    shortDescription: "Laminated with butter and baked golden every morning.",
    category: "pastries",
    basePricePaise: 9000,
    priceUnit: "EACH",
    ingredients: ["Wheat flour", "Butter", "Milk", "Sugar", "Yeast", "Salt"],
    allergens: ["GLUTEN", "DAIRY"],
    defaultQuantity: 24,
  },
  {
    slug: "pain-au-chocolat",
    name: "Pain au chocolat",
    shortDescription: "Croissant dough rolled around two bars of dark chocolate.",
    category: "pastries",
    basePricePaise: 12000,
    priceUnit: "EACH",
    ingredients: ["Wheat flour", "Butter", "Dark chocolate", "Milk", "Sugar", "Yeast", "Salt"],
    allergens: ["GLUTEN", "DAIRY", "SOY"],
    defaultQuantity: 18,
  },
  {
    slug: "brownie-box",
    name: "Brownie box",
    shortDescription: "Six fudgy dark-chocolate brownies with walnuts.",
    category: "cakes",
    basePricePaise: 32000,
    priceUnit: "PER_BOX",
    ingredients: ["Dark chocolate", "Butter", "Sugar", "Eggs", "Wheat flour", "Walnuts"],
    allergens: ["GLUTEN", "DAIRY", "EGGS", "NUTS", "SOY"],
    defaultQuantity: 8,
  },
  {
    slug: "chocolate-truffle-cake",
    name: "Chocolate truffle cake",
    shortDescription: "Dark chocolate sponge layered with ganache.",
    about: "Sold by the kilo. Put the message for the top in your order note.",
    category: "cakes",
    basePricePaise: 120000,
    priceUnit: "PER_KG",
    ingredients: ["Dark chocolate", "Cream", "Butter", "Sugar", "Eggs", "Wheat flour", "Cocoa"],
    allergens: ["GLUTEN", "DAIRY", "EGGS", "SOY"],
    defaultQuantity: 4,
    noticeDays: 2,
    bakeSeparately: true,
    days: [SAT, SUN],
  },
  {
    slug: "custom-birthday-cake",
    name: "Custom birthday cake",
    shortDescription: "Your flavour, size and message — talk it through with us on the phone.",
    about: "Sold by the kilo, from 1 kg. Call us with the date, flavour and the message for the top.",
    category: "cakes",
    basePricePaise: 150000,
    priceUnit: "PER_KG",
    ingredients: ["Wheat flour", "Butter", "Sugar", "Eggs", "Cream"],
    allergens: ["GLUTEN", "DAIRY", "EGGS"],
    defaultQuantity: 1,
    noticeDays: 3,
    orderable: false,
    bakeSeparately: true,
    days: [],
  },
  {
    slug: "chicken-puff",
    name: "Chicken puff",
    shortDescription: "Flaky puff pastry filled with spiced chicken and onion.",
    category: "savoury",
    basePricePaise: 6000,
    priceUnit: "EACH",
    ingredients: ["Wheat flour", "Butter", "Chicken", "Onion", "Spices"],
    allergens: ["GLUTEN", "DAIRY"],
    defaultQuantity: 30,
  },
  {
    slug: "plum-cake",
    name: "Rum and raisin plum cake",
    shortDescription: "Dark, fruit-heavy plum cake, 500 g.",
    category: "seasonal",
    basePricePaise: 55000,
    priceUnit: "EACH",
    ingredients: ["Wheat flour", "Butter", "Sugar", "Eggs", "Raisins", "Candied peel", "Cashews", "Spices"],
    allergens: ["GLUTEN", "DAIRY", "EGGS", "NUTS"],
    defaultQuantity: 6,
    days: [FRI, SAT, SUN],
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

  for (const [sortOrder, category] of CATEGORIES.entries()) {
    await prisma.menuCategory.upsert({ where: { slug: category.slug }, update: {}, create: { ...category, sortOrder } })
  }

  const items = []
  for (const { days, override, ...item } of ITEMS) {
    const row = await prisma.menuItem.upsert({ where: { slug: item.slug }, update: {}, create: item })
    items.push({ row, days, override })
  }

  const today = todayIn(settings.timezone)
  for (let offset = 0; offset < 7; offset++) {
    const date = addDays(today, offset)
    const day = await prisma.menuDay.upsert({
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

    for (const { row, days, override } of items) {
      if (days && !days.includes(weekday(date))) continue
      await prisma.menuDayItem.upsert({
        where: { menuDayId_menuItemId: { menuDayId: day.id, menuItemId: row.id } },
        update: {},
        create: {
          menuDayId: day.id,
          menuItemId: row.id,
          quantityAvailable: row.defaultQuantity,
          priceOverridePaise: override?.day === weekday(date) ? override.pricePaise : null,
        },
      })
    }
  }

  const [staff, categories, menuItems, menuDays, menuDayItems] = await Promise.all([
    prisma.staff.count({ where: { role: "OWNER" } }),
    prisma.menuCategory.count(),
    prisma.menuItem.count(),
    prisma.menuDay.count(),
    prisma.menuDayItem.count(),
  ])
  console.log(`Seeded: settings ✓, ${staff} owners, ${categories} categories, ${menuItems} items, ${menuDays} days, ${menuDayItems} day items`)
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
