"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireStaff } from "@/auth"
import { isIsoDate } from "@/lib/dates"
import { loadSheetVersion, type SheetVersion } from "@/lib/daysheet/queries"
import { setBaked, setCollected, type TickOutcome } from "@/lib/daysheet/ticks"

/** The day sheet's server actions: the two ticks, and the version the open sheet polls. */

type Invalid = { ok: false; reason: "INVALID" }
const invalid: Invalid = { ok: false, reason: "INVALID" }

const tickInput = z.object({ id: z.string().min(1).max(40), done: z.boolean() })

/** Baked / not baked. Undo is the same call the other way. */
export async function tickBaked(input: z.input<typeof tickInput>): Promise<TickOutcome | Invalid> {
  await requireStaff()
  const parsed = tickInput.safeParse(input)
  if (!parsed.success) return invalid
  const result = await setBaked(parsed.data.id, parsed.data.done)
  revalidatePath("/admin/daysheet")
  return result
}

/** Collected / not collected. Moves the order's status, so every admin screen showing it refreshes. */
export async function tickCollected(input: z.input<typeof tickInput>): Promise<TickOutcome | Invalid> {
  await requireStaff()
  const parsed = tickInput.safeParse(input)
  if (!parsed.success) return invalid
  const result = await setCollected(parsed.data.id, parsed.data.done)
  revalidatePath("/admin", "layout")
  return result
}

/** What the open sheet compares against its own version every few seconds. Null for a malformed date. */
export async function checkDaySheet(date: string): Promise<SheetVersion | null> {
  await requireStaff()
  if (!isIsoDate(date)) return null
  return loadSheetVersion(date)
}
