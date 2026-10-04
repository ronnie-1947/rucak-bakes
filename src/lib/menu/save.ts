import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import type { Allergen } from "@/lib/menu/allergens"
import { slugify } from "@/lib/menu/form"
import type { PriceUnit } from "@/lib/menu/units"

/** The item as the save action hands it over — already validated, money in paise. */
export type ItemRecord = {
  name: string
  slug: string
  shortDescription: string
  category: { slug: string } | { newName: string }
  basePricePaise: number
  priceUnit: PriceUnit
  isActive: boolean
  photos: { publicId: string; alt: string }[]
  about: string
  ingredients: string[]
  allergens: Allergen[]
  orderable: boolean
  noticeDays: number
  bakeSeparately: boolean
  defaultQuantity: number
  sizeNote: string
  storageNote: string
}

export type SaveOutcome =
  | { ok: true; id: string; categorySlug: string; removedPhotos: string[] }
  | { ok: false; reason: "SLUG_TAKEN"; takenBy: string }
  | { ok: false; reason: "NOT_FOUND" }

/** A typed category becomes a real one (or reuses the one already called that), sorted last. */
async function resolveCategory(tx: Prisma.TransactionClient, category: ItemRecord["category"]): Promise<string> {
  if ("slug" in category) return category.slug
  const name = category.newName.trim()
  const existing = await tx.menuCategory.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: { slug: true } })
  if (existing) return existing.slug
  const base = slugify(name) || "category"
  let slug = base
  for (let n = 2; await tx.menuCategory.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${base}-${n}`
  const last = await tx.menuCategory.aggregate({ _max: { sortOrder: true } })
  await tx.menuCategory.create({ data: { name, slug, sortOrder: (last._max.sortOrder ?? 0) + 1 } })
  return slug
}

/**
 * Creates the item (id null) or replaces its details. Photos keep their order — the first is the cover —
 * and their alt text travels alongside in `imageAlts`. Returns the photos this save dropped, for cleanup.
 */
export async function saveItem(id: string | null, record: ItemRecord): Promise<SaveOutcome> {
  const clash = await prisma.menuItem.findFirst({ where: { slug: record.slug, ...(id ? { id: { not: id } } : {}) }, select: { name: true } })
  if (clash) return { ok: false, reason: "SLUG_TAKEN", takenBy: clash.name }

  try {
    return await prisma.$transaction(async (tx) => {
      const before = id ? await tx.menuItem.findUnique({ where: { id }, select: { images: true } }) : null
      if (id && !before) return { ok: false as const, reason: "NOT_FOUND" as const }
      const category = await resolveCategory(tx, record.category)
      const data = {
        name: record.name,
        slug: record.slug,
        shortDescription: record.shortDescription,
        category,
        basePricePaise: record.basePricePaise,
        priceUnit: record.priceUnit,
        isActive: record.isActive,
        images: record.photos.map((photo) => photo.publicId),
        imageAlts: record.photos.map((photo) => photo.alt),
        about: record.about || null,
        ingredients: record.ingredients,
        allergens: record.allergens,
        orderable: record.orderable,
        noticeDays: record.noticeDays,
        bakeSeparately: record.bakeSeparately,
        defaultQuantity: record.defaultQuantity,
        sizeNote: record.sizeNote || null,
        storageNote: record.storageNote || null,
      }
      const saved = id
        ? await tx.menuItem.update({ where: { id }, data, select: { id: true } })
        : await tx.menuItem.create({ data, select: { id: true } })
      const kept = new Set(data.images)
      return { ok: true as const, id: saved.id, categorySlug: category, removedPhotos: (before?.images ?? []).filter((photo) => !kept.has(photo)) }
    })
  } catch (error) {
    // Two saves raced for the same slug: the unique index decided.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, reason: "SLUG_TAKEN", takenBy: "" }
    throw error
  }
}
