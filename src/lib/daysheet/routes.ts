import { type IsoDate, isIsoDate } from "@/lib/dates"

/**
 * The day sheet's view state, as it lives in the URL — so the counter tablet and the baker's phone can
 * be on the same page by link, and a refresh keeps the tab. Client-safe.
 *
 *   /admin/daysheet?date=2026-10-04&view=pickups&pending=1
 *
 * Defaults (today, the Bake tab, verified only) are left out, so the bare path is this morning's sheet.
 */

export const sheetViews = ["bake", "pickups"] as const
export type SheetView = (typeof sheetViews)[number]

export type SheetParams = {
  date: IsoDate
  view: SheetView
  /** Show pending orders beside the verified ones — never added into a bake total. */
  pending: boolean
}

type Params = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function parseSheetParams(params: Params, today: IsoDate): SheetParams {
  const date = first(params.date)
  const view = first(params.view)
  return {
    date: date && isIsoDate(date) ? date : today,
    view: (sheetViews as readonly string[]).includes(view ?? "") ? (view as SheetView) : "bake",
    pending: first(params.pending) === "1",
  }
}

export function sheetHref(params: SheetParams, today: IsoDate): string {
  const query = new URLSearchParams()
  if (params.date !== today) query.set("date", params.date)
  if (params.view !== "bake") query.set("view", params.view)
  if (params.pending) query.set("pending", "1")
  const search = query.toString()
  return search ? `/admin/daysheet?${search}` : "/admin/daysheet"
}
