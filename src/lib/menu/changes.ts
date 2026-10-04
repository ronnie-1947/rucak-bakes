import { type IsoDate, toDbDate } from "@/lib/dates"
import { serializable, type Tx } from "@/lib/db"

/**
 * Writes behind the menu library. Nothing here deletes a menu item — items archive (non-negotiable 7).
 * The one row that can go is a MenuDayItem: taking an inactive item off an upcoming day's counter. Orders don't
 * hang off those rows (§10R) — an order for the item stays and still bakes from its own lines.
 *
 * Every change returns a snapshot of what it overwrote, which is exactly what Undo puts back.
 */

/** The state to restore: each item's flags, and the day rows the change removed. */
export type MenuSnapshot = {
  items: { id: string; isActive: boolean; archivedAt: string | null }[]
  days: { menuDayId: string; menuItemId: string; quantityAvailable: number; priceOverridePaise: number | null }[]
}

export type MenuChange = { snapshot: MenuSnapshot; removedDays: number }

async function snapshotItems(tx: Tx, ids: string[]): Promise<MenuSnapshot["items"]> {
  const rows = await tx.menuItem.findMany({ where: { id: { in: ids } }, select: { id: true, isActive: true, archivedAt: true } })
  return rows.map((row) => ({ id: row.id, isActive: row.isActive, archivedAt: row.archivedAt?.toISOString() ?? null }))
}

/** Takes the items off the counter on every upcoming day. Returns the rows removed. */
async function removeFromUpcomingDays(tx: Tx, ids: string[], today: IsoDate): Promise<MenuSnapshot["days"]> {
  const rows = await tx.menuDayItem.findMany({
    where: { menuItemId: { in: ids }, menuDay: { date: { gte: toDbDate(today) } } },
    select: { id: true, menuDayId: true, menuItemId: true, quantityAvailable: true, priceOverridePaise: true },
  })
  await tx.menuDayItem.deleteMany({ where: { id: { in: rows.map((row) => row.id) } } })
  return rows.map((row) => ({
    menuDayId: row.menuDayId,
    menuItemId: row.menuItemId,
    quantityAvailable: row.quantityAvailable,
    priceOverridePaise: row.priceOverridePaise,
  }))
}

function countDays(days: MenuSnapshot["days"]): number {
  return new Set(days.map((day) => day.menuDayId)).size
}

/** Activate or deactivate. Deactivating can also take the items off their upcoming days. */
export async function setItemsActive(ids: string[], active: boolean, removeFromDays: boolean, today: IsoDate): Promise<MenuChange> {
  return serializable(async (tx) => {
    const items = await snapshotItems(tx, ids)
    const live = items.filter((item) => item.archivedAt === null).map((item) => item.id)
    await tx.menuItem.updateMany({ where: { id: { in: live } }, data: { isActive: active } })
    const days = !active && removeFromDays ? await removeFromUpcomingDays(tx, live, today) : []
    return { snapshot: { items, days }, removedDays: countDays(days) }
  })
}

/** Archive: hidden from customers and the Calendar, off the counter on every upcoming day. */
export async function archiveItems(ids: string[], today: IsoDate): Promise<MenuChange> {
  return serializable(async (tx) => {
    const items = await snapshotItems(tx, ids)
    const live = items.filter((item) => item.archivedAt === null).map((item) => item.id)
    await tx.menuItem.updateMany({ where: { id: { in: live } }, data: { isActive: false, archivedAt: new Date() } })
    const days = await removeFromUpcomingDays(tx, live, today)
    return { snapshot: { items, days }, removedDays: countDays(days) }
  })
}

/** Back into the library, inactive — the owner decides when it's on sale again. */
export async function restoreItem(id: string): Promise<MenuChange> {
  return serializable(async (tx) => {
    const items = await snapshotItems(tx, [id])
    await tx.menuItem.updateMany({ where: { id, archivedAt: { not: null } }, data: { archivedAt: null, isActive: false } })
    return { snapshot: { items, days: [] }, removedDays: 0 }
  })
}

async function freeSlug(tx: Tx, base: string): Promise<string> {
  const taken = new Set((await tx.menuItem.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })).map((row) => row.slug))
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`
}

/**
 * A copy of the item's details and photos, inactive and on no day. Photos are shared public_ids — safe,
 * because deleteImage refuses while any item still uses one. Undo archives the copy (nothing is deleted).
 */
export async function duplicateItem(id: string, name: (original: string) => string): Promise<(MenuChange & { id: string; name: string }) | null> {
  return serializable(async (tx) => {
    const original = await tx.menuItem.findUnique({ where: { id } })
    if (!original) return null
    const copyName = name(original.name)
    const copy = await tx.menuItem.create({
      data: {
        slug: await freeSlug(tx, `${original.slug}-copy`),
        name: copyName,
        shortDescription: original.shortDescription,
        about: original.about,
        category: original.category,
        basePricePaise: original.basePricePaise,
        priceUnit: original.priceUnit,
        ingredients: original.ingredients,
        allergens: original.allergens,
        images: original.images,
        imageAlts: original.imageAlts,
        orderable: original.orderable,
        noticeDays: original.noticeDays,
        bakeSeparately: original.bakeSeparately,
        defaultQuantity: original.defaultQuantity,
        sizeNote: original.sizeNote,
        storageNote: original.storageNote,
        isActive: false,
      },
      select: { id: true },
    })
    return {
      id: copy.id,
      name: copyName,
      snapshot: { items: [{ id: copy.id, isActive: false, archivedAt: new Date().toISOString() }], days: [] },
      removedDays: 0,
    }
  })
}

/** Undo: put the flags back and re-add the removed day rows — on days that haven't passed and don't have the item again already. */
export async function applySnapshot(snapshot: MenuSnapshot, today: IsoDate): Promise<void> {
  await serializable(async (tx) => {
    for (const item of snapshot.items) {
      await tx.menuItem.updateMany({
        where: { id: item.id },
        data: { isActive: item.isActive, archivedAt: item.archivedAt ? new Date(item.archivedAt) : null },
      })
    }
    if (snapshot.days.length === 0) return
    const open = await tx.menuDay.findMany({
      where: { id: { in: [...new Set(snapshot.days.map((day) => day.menuDayId))] }, date: { gte: toDbDate(today) } },
      select: { id: true },
    })
    const stillAhead = new Set(open.map((day) => day.id))
    await tx.menuDayItem.createMany({ data: snapshot.days.filter((day) => stillAhead.has(day.menuDayId)), skipDuplicates: true })
  })
}
