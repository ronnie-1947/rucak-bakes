import type { Allergen } from "@/lib/menu/allergens"
import type { PriceUnit } from "@/lib/menu/units"

/**
 * The menu item form's values and rules — shared by the browser (live errors, the save bar) and the
 * save action (which re-checks everything). Client-safe.
 */

export const LIMITS = {
  name: 80,
  shortDescription: 80,
  about: 600,
  photos: 6,
  alt: 150,
  ingredient: 40,
  ingredients: 40,
  sizeNote: 60,
  storageNote: 120,
}
export const QUANTITY = { min: 0, max: 99 }
/** Days of notice the form offers — the booking window (Settings.orderAheadDays, 7): longer could never be ordered. The DB allows 0–30. */
export const NOTICE = { min: 0, max: 7 }
/** 10MB, JPG or PNG — what the photo zone says it takes. */
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024
export const PHOTO_TYPES = ["image/jpeg", "image/png"]

/** An existing category by slug, or one typed into "Add category" — created when the item saves. */
export type CategoryChoice = { slug: string } | { newName: string } | null

export type PhotoValue = { publicId: string; alt: string }

export type MenuItemValues = {
  name: string
  slug: string
  shortDescription: string
  category: CategoryChoice
  /** Rupees as typed — "240" or "240.50". Converted to paise on save. */
  price: string
  priceUnit: PriceUnit
  isActive: boolean
  /** First is the cover. */
  photos: PhotoValue[]
  about: string
  ingredients: string[]
  allergens: Allergen[]
  /** Off → call only: on the menu with a Call button, never in a cart. */
  orderable: boolean
  /** Days of notice an online order needs (orders/deadline.ts). Kept while ordering is off. */
  noticeDays: number
  /** The day sheet lists each order of it on its own row, with the customer's note. */
  bakeSeparately: boolean
  /** The usual counter batch — pre-fills the quantity when it's added as a counter-item in the Calendar. */
  defaultQuantity: number
  sizeNote: string
  storageNote: string
}

export const BLANK: MenuItemValues = {
  name: "",
  slug: "",
  shortDescription: "",
  category: null,
  price: "",
  priceUnit: "EACH",
  isActive: true,
  photos: [],
  about: "",
  ingredients: [],
  allergens: [],
  orderable: true,
  noticeDays: 1,
  bakeSeparately: false,
  defaultQuantity: 10,
  sizeNote: "",
  storageNote: "",
}

const RUPEES = /^\d{1,6}(\.\d{1,2})?$/

/** "240.5" → 24050; null for anything that isn't a positive amount. */
export function priceToPaise(price: string): number | null {
  const trimmed = price.trim()
  if (!RUPEES.test(trimmed)) return null
  const [whole, fraction = ""] = trimmed.split(".")
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
  return paise > 0 ? paise : null
}

/** A call-only item may leave its price blank — stored as 0, it reads "Price on request". */
export function priceOnRequest(orderable: boolean, price: string): boolean {
  return !orderable && !price.trim()
}

/** 24050 → "240.50", 24000 → "240". */
export function paiseToPrice(paise: number): string {
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2)
}

/** "Rum & raisin cake!" → "rum-raisin-cake" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type FieldError = "nameMissing" | "slugInvalid" | "descriptionMissing" | "descriptionLong" | "categoryMissing" | "priceInvalid"

/** Problems with the typed values, keyed by field. Photo upload states are the form's own concern. */
export function validate(values: MenuItemValues): Partial<Record<"name" | "slug" | "shortDescription" | "category" | "price", FieldError>> {
  const errors: Partial<Record<"name" | "slug" | "shortDescription" | "category" | "price", FieldError>> = {}
  if (!values.name.trim()) errors.name = "nameMissing"
  if (!SLUG.test(values.slug)) errors.slug = "slugInvalid"
  if (!values.shortDescription.trim()) errors.shortDescription = "descriptionMissing"
  else if (values.shortDescription.trim().length > LIMITS.shortDescription) errors.shortDescription = "descriptionLong"
  if (!values.category) errors.category = "categoryMissing"
  if (!priceOnRequest(values.orderable, values.price) && priceToPaise(values.price) === null) errors.price = "priceInvalid"
  return errors
}

export type ChangeKey =
  | "name"
  | "slug"
  | "shortDescription"
  | "category"
  | "price"
  | "priceUnit"
  | "isActive"
  | "photos"
  | "alt"
  | "about"
  | "ingredients"
  | "allergens"
  | "orderable"
  | "noticeDays"
  | "bakeSeparately"
  | "defaultQuantity"
  | "sizeNote"
  | "storageNote"

function sameCategory(a: CategoryChoice, b: CategoryChoice): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** Which fields differ from the saved item, in form order — "See changes" lists them. */
export function changedFields(current: MenuItemValues, saved: MenuItemValues): ChangeKey[] {
  const out: ChangeKey[] = []
  const plain = ["name", "slug", "shortDescription"] as const
  for (const key of plain) if (current[key] !== saved[key]) out.push(key)
  if (!sameCategory(current.category, saved.category)) out.push("category")
  if (current.price.trim() !== saved.price.trim()) out.push("price")
  if (current.priceUnit !== saved.priceUnit) out.push("priceUnit")
  if (current.isActive !== saved.isActive) out.push("isActive")
  if (current.photos.map((p) => p.publicId).join("|") !== saved.photos.map((p) => p.publicId).join("|")) out.push("photos")
  if (current.photos.map((p) => p.alt).join("|") !== saved.photos.map((p) => p.alt).join("|")) out.push("alt")
  if (current.about !== saved.about) out.push("about")
  if (current.ingredients.join("|") !== saved.ingredients.join("|")) out.push("ingredients")
  if ([...current.allergens].sort().join("|") !== [...saved.allergens].sort().join("|")) out.push("allergens")
  if (current.orderable !== saved.orderable) out.push("orderable")
  if (current.noticeDays !== saved.noticeDays) out.push("noticeDays")
  if (current.bakeSeparately !== saved.bakeSeparately) out.push("bakeSeparately")
  if (current.defaultQuantity !== saved.defaultQuantity) out.push("defaultQuantity")
  if (current.sizeNote !== saved.sizeNote) out.push("sizeNote")
  if (current.storageNote !== saved.storageNote) out.push("storageNote")
  return out
}
