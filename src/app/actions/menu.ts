"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireStaff } from "@/auth"
import { todayIn } from "@/lib/dates"
import { getDictionary } from "@/lib/i18n"
import { applySnapshot, archiveItems, duplicateItem, type MenuSnapshot, restoreItem, setItemsActive } from "@/lib/menu/changes"
import { getSettings } from "@/lib/settings"
import { fill } from "@/lib/template"

/** What the menu library gets back — the snapshot is what its Undo button sends to undoMenuChange. */
export type MenuChangeResult = { ok: true; undo: MenuSnapshot; removedDays: number; name?: string } | { ok: false }

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
  return { ok: true, undo: copy.snapshot, removedDays: 0, name: copy.name }
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
