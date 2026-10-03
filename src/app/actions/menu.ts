"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { deleteImage } from "@/app/actions/cloudinary"
import { requireStaff } from "@/auth"
import { isOurPublicId } from "@/lib/cloudinary"
import { todayIn } from "@/lib/dates"
import { getDictionary } from "@/lib/i18n"
import { allergens } from "@/lib/menu/allergens"
import { applySnapshot, archiveItems, duplicateItem, type MenuSnapshot, restoreItem, setItemsActive } from "@/lib/menu/changes"
import { LIMITS, priceToPaise, QUANTITY, SLUG } from "@/lib/menu/form"
import { saveItem } from "@/lib/menu/save"
import { priceUnits } from "@/lib/menu/units"
import { getSettings } from "@/lib/settings/row"
import { fill } from "@/lib/template"

/**
 * What a menu change gets back — the snapshot is what the Undo button sends to undoMenuChange.
 * `copy` is the new item a Duplicate made.
 */
export type MenuChangeResult = { ok: true; undo: MenuSnapshot; removedDays: number; copy?: { id: string; name: string } } | { ok: false }

const id = z.string().min(1).max(40)
const ids = z.array(id).min(1).max(100)

async function today() {
  return todayIn((await getSettings()).timezone)
}

/** Menu changes show on the admin list and on every customer page that lists items. */
function refresh() {
  revalidatePath("/", "layout")
}

const activeInput = z.object({ ids, active: z.boolean(), removeFromDays: z.boolean().default(false) })

/** The list's switch and the bulk bar's Activate / Deactivate. */
export async function setMenuItemsActive(input: z.input<typeof activeInput>): Promise<MenuChangeResult> {
  await requireStaff()
  const parsed = activeInput.safeParse(input)
  if (!parsed.success) return { ok: false }
  const { snapshot, removedDays } = await setItemsActive(parsed.data.ids, parsed.data.active, parsed.data.removeFromDays, await today())
  refresh()
  return { ok: true, undo: snapshot, removedDays }
}

/** The ⋯ menu's and the bulk bar's Archive — always behind the confirm dialog that names the days. */
export async function archiveMenuItems(input: { ids: string[] }): Promise<MenuChangeResult> {
  await requireStaff()
  const parsed = z.object({ ids }).safeParse(input)
  if (!parsed.success) return { ok: false }
  const { snapshot, removedDays } = await archiveItems(parsed.data.ids, await today())
  refresh()
  return { ok: true, undo: snapshot, removedDays }
}

export async function restoreMenuItem(input: { id: string }): Promise<MenuChangeResult> {
  await requireStaff()
  const parsed = z.object({ id }).safeParse(input)
  if (!parsed.success) return { ok: false }
  const { snapshot } = await restoreItem(parsed.data.id)
  refresh()
  return { ok: true, undo: snapshot, removedDays: 0 }
}

export async function duplicateMenuItem(input: { id: string }): Promise<MenuChangeResult> {
  await requireStaff()
  const parsed = z.object({ id }).safeParse(input)
  if (!parsed.success) return { ok: false }
  const dict = await getDictionary("en")
  const copy = await duplicateItem(parsed.data.id, (name) => fill(dict.admin.menu.copyName, { name }))
  if (!copy) return { ok: false }
  refresh()
  return { ok: true, undo: copy.snapshot, removedDays: 0, copy: { id: copy.id, name: copy.name } }
}

const snapshotInput = z.object({
  items: z.array(z.object({ id, isActive: z.boolean(), archivedAt: z.iso.datetime().nullable() })).max(100),
  days: z
    .array(
      z.object({
        menuDayId: id,
        menuItemId: id,
        quantityAvailable: z.number().int().min(0).max(100_000),
        priceOverridePaise: z.number().int().min(0).nullable(),
      }),
    )
    .max(2000),
})

/** The undo strip's Undo: puts back exactly what the last change overwrote. */
export async function undoMenuChange(input: MenuSnapshot): Promise<{ ok: boolean }> {
  await requireStaff()
  const parsed = snapshotInput.safeParse(input)
  if (!parsed.success) return { ok: false }
  await applySnapshot(parsed.data, await today())
  refresh()
  return { ok: true }
}

const text = (max: number) => z.string().trim().max(max)

const saveInput = z.object({
  id: id.nullable(),
  name: text(LIMITS.name).min(1),
  slug: z.string().trim().max(80).regex(SLUG),
  shortDescription: text(LIMITS.shortDescription).min(1),
  category: z.union([z.object({ slug: z.string().trim().min(1).max(60) }), z.object({ newName: text(40).min(1) })]),
  price: z.string(),
  priceUnit: z.enum(priceUnits),
  isActive: z.boolean(),
  photos: z.array(z.object({ publicId: z.string().refine(isOurPublicId), alt: text(LIMITS.alt) })).max(LIMITS.photos),
  about: text(LIMITS.about),
  ingredients: z.array(text(LIMITS.ingredient).min(1)).max(LIMITS.ingredients),
  allergens: z.array(z.enum(allergens)).max(allergens.length),
  defaultQuantity: z.number().int().min(QUANTITY.min).max(QUANTITY.max),
  sizeNote: text(LIMITS.sizeNote),
  storageNote: text(LIMITS.storageNote),
})

export type SaveMenuItemResult =
  | { ok: true; id: string; categorySlug: string }
  | { ok: false; reason: "INVALID" | "NOT_FOUND" }
  | { ok: false; reason: "SLUG_TAKEN"; takenBy: string }

/**
 * The item form's Save / Create. Re-checks everything the form checks; prices arrive as typed rupees and
 * are stored as paise. Photos the save dropped are destroyed on Cloudinary once nothing else uses them.
 */
export async function saveMenuItem(input: z.input<typeof saveInput>): Promise<SaveMenuItemResult> {
  await requireStaff()
  const parsed = saveInput.safeParse(input)
  if (!parsed.success) return { ok: false, reason: "INVALID" }
  const { id: itemId, price, ...rest } = parsed.data
  const basePricePaise = priceToPaise(price)
  if (basePricePaise === null) return { ok: false, reason: "INVALID" }

  const outcome = await saveItem(itemId, {
    ...rest,
    basePricePaise,
    ingredients: rest.ingredients.filter((name, index, all) => all.findIndex((other) => other.toLowerCase() === name.toLowerCase()) === index),
    allergens: [...new Set(rest.allergens)],
  })
  if (!outcome.ok) return outcome

  // Best effort: deleteImage refuses while anything still uses a photo, and a Cloudinary hiccup must not fail the save.
  await Promise.allSettled(outcome.removedPhotos.map((publicId) => deleteImage(publicId)))
  refresh()
  return { ok: true, id: outcome.id, categorySlug: outcome.categorySlug }
}
