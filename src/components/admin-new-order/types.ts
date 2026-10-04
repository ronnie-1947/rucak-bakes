import type { Dict } from "@/lib/i18n"
import type { PriceUnit } from "@/lib/menu/units"

export type AdminCopy = Dict["admin"]
export type NewOrderCopy = AdminCopy["newOrder"]

/** What the form's parts read from the dict: the screen's own copy and the words it shares with other admin screens. */
export type FormCopy = {
  newOrder: NewOrderCopy
  customerFlags: AdminCopy["customerFlags"]
  priceUnits: AdminCopy["priceUnits"]
}

export type Mode = "PICKUP" | "DELIVERY"

/**
 * A line as the form holds it: the item as it was when added (so a refresh that takes it off the menu still shows it),
 * the quantity, and the price field's text — rupees, prefilled with the menu price; empty means the menu price.
 */
export type DraftLine = {
  id: string
  name: string
  unit: PriceUnit
  menuPricePaise: number
  noticeDays: number
  quantity: number
  price: string
}

/** A line worked out: the price it will be added at, whether that's custom, and whether the item is still on the menu. */
export type FormLine = DraftLine & {
  unitPricePaise: number
  custom: boolean
  totalPaise: number
  gone: boolean
}

/** Where the phone lookup stands for the number in the field. */
export type LookupState = "idle" | "looking" | "found" | "new" | "failed"

/** Why the last Add order didn't go through — shown above the button until something changes. */
export type Refusal =
  | { kind: "closed" | "past"; date: string }
  | { kind: "item"; name: string | null }
  | { kind: "invalid"; field: keyof NewOrderCopy["refusals"]["fields"] | null }
  | { kind: "network" }

/** The counts the full-day confirm names — the server's when it refused, else the page's. */
export type FullCounts = { count: number; verified: number; max: number }
