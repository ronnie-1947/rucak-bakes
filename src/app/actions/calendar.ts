"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireStaff } from "@/auth"
import { type CutoffChoice, parseCutoffKey } from "@/lib/calendar/cutoffs"
import { DAY_QUANTITY, LIMITS, MAX_ORDERS, OVERBOOK_MAX } from "@/lib/calendar/form"
import { inPlanningRange } from "@/lib/calendar/routes"
import { applyToWeek, copyWeek, type DayRefusal, patchDay, saveDay } from "@/lib/calendar/writes"
import { isIsoDate, todayIn, weekday } from "@/lib/dates"
import { getSettings } from "@/lib/settings"

/**
 * The Calendar's server actions. Each re-checks the staff row, validates, and refuses dates outside the
 * weeks the planner shows. Plans show on every customer page, so every change revalidates the whole app.
 */

const date = z.string().refine(isIsoDate)
const monday = date.refine((value) => weekday(value) === 1)
/** A cutoff travels as its <select> key, "1@18:00". */
const cutoff = z
  .string()
  .refine((value) => parseCutoffKey(value) !== null)
  .transform((value) => parseCutoffKey(value) as CutoffChoice)
const maxOrders = z.number().int().min(MAX_ORDERS.min).max(MAX_ORDERS.max)

async function context() {
  const settings = await getSettings()
  return { settings, today: todayIn(settings.timezone) }
}

function refresh() {
  revalidatePath("/", "layout")
}

type Invalid = { ok: false; reason: "INVALID" }
const invalid: Invalid = { ok: false, reason: "INVALID" }

export type DayActionResult = { ok: true } | DayRefusal | Invalid

const patchInput = z.object({
  date,
  isOpen: z.boolean().optional(),
  cutoff: cutoff.optional(),
  maxOrders: maxOrders.optional(),
  confirmClose: z.boolean().default(false),
})

/** A week card's Open switch, Orders close or Max orders — saved straight away. */
export async function updateDay(input: z.input<typeof patchInput>): Promise<DayActionResult> {
  await requireStaff()
  const parsed = patchInput.safeParse(input)
  if (!parsed.success) return invalid
  const { settings, today } = await context()
  if (!inPlanningRange(parsed.data.date, today)) return invalid
  const { date: day, confirmClose, ...patch } = parsed.data
  const result = await patchDay(day, patch, confirmClose, settings, today)
  if (result.ok) refresh()
  return result
}

const applyInput = z.object({ monday, cutoff, maxOrders })

export type ApplyResult = { ok: true; changed: number } | Invalid

/** "Apply to all days": one cutoff and max for every open day left in the week. */
export async function applyToAllDays(input: z.input<typeof applyInput>): Promise<ApplyResult> {
  await requireStaff()
  const parsed = applyInput.safeParse(input)
  if (!parsed.success) return invalid
  const { settings, today } = await context()
  if (!inPlanningRange(parsed.data.monday, today)) return invalid
  const result = await applyToWeek(parsed.data.monday, parsed.data.cutoff, parsed.data.maxOrders, settings, today)
  refresh()
  return result
}

const copyInput = z.object({ monday, quantities: z.boolean(), prices: z.boolean() })

export type CopyWeekResult = Awaited<ReturnType<typeof copyWeek>> | Invalid

/** "Copy last week" into the week starting `monday`. */
export async function copyLastWeek(input: z.input<typeof copyInput>): Promise<CopyWeekResult> {
  await requireStaff()
  const parsed = copyInput.safeParse(input)
  if (!parsed.success) return invalid
  const { settings, today } = await context()
  if (!inPlanningRange(parsed.data.monday, today)) return invalid
  const result = await copyWeek(parsed.data.monday, { quantities: parsed.data.quantities, prices: parsed.data.prices }, settings, today)
  if (result.copied > 0) refresh()
  return result
}

const id = z.string().min(1).max(40)

const saveInput = z.object({
  date,
  isOpen: z.boolean(),
  cutoff,
  maxOrders,
  overbookLimit: z.number().int().min(MAX_ORDERS.min).max(OVERBOOK_MAX),
  publicNote: z.string().trim().max(LIMITS.publicNote),
  closureNote: z.string().trim().max(LIMITS.closureNote),
  items: z
    .array(
      z.object({
        menuItemId: id,
        quantityAvailable: z.number().int().min(DAY_QUANTITY.min).max(DAY_QUANTITY.max),
        priceOverridePaise: z.number().int().min(1).max(10_000_000).nullable(),
      }),
    )
    .max(500)
    .refine((items) => new Set(items.map((item) => item.menuItemId)).size === items.length),
  confirmClose: z.boolean().default(false),
})

/** The day editor's Save day. */
export async function saveMenuDay(input: z.input<typeof saveInput>): Promise<DayActionResult> {
  await requireStaff()
  const parsed = saveInput.safeParse(input)
  if (!parsed.success) return invalid
  const { settings, today } = await context()
  const { date: day, confirmClose, ...record } = parsed.data
  if (!inPlanningRange(day, today) || record.overbookLimit < record.maxOrders) return invalid
  const result = await saveDay(day, record, confirmClose, settings, today)
  if (result.ok) refresh()
  return result
}
