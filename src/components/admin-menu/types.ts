import type { Dict } from "@/lib/i18n"

export type AdminCopy = Dict["admin"]
export type MenuCopy = AdminCopy["menu"]
export type PriceUnitCopy = AdminCopy["priceUnits"]

/** `auto` (no ?view=) lets the width decide: a list on phones, a grid from 768px. */
export type ViewMode = "auto" | "list" | "grid"
