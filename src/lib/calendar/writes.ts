import { type CopyDayFacts, type CopyRow, planWeekCopy } from "@/lib/calendar/copy-plan"
import type { CutoffChoice } from "@/lib/calendar/cutoffs"
import type { DayOrder } from "@/lib/calendar/week"
import { addDays, computeCutoffAt, dateRange, fromDbDate, type IsoDate, toDbDate } from "@/lib/dates"
import { serializable, type Tx } from "@/lib/db"
import { LIVE_STATUSES, VERIFIED_STATUSES } from "@/lib/orders/status"

/**
 * Every write behind the Calendar. Each runs in one serializable() transaction and takes the day's row
 * lock first — the same lock createOrder and verifyOrder take — so a plan never changes under an order
 * being placed. Nothing here deletes a MenuDay (orders point at it), and a MenuDayItem only goes when
 * nothing is ordered on it.
 */

/** What the writes need from Settings: the defaults a new day starts from, and the bakery's clock. */
export type PlanSettings = {
  timezone: string
  defaultCutoffTime: string
  defaultCutoffDays: number
  defaultMaxOrders: number
  defaultOverbook: number
}

export type DayRefusal =
  | { ok: false; reason: "PAST" }
  /** Closing a day that still has orders — the confirm names them. */
  | { ok: false; reason: "HAS_ORDERS"; orders: DayOrder[] }
  /** A quantity below what's already ordered, or an ordered item taken off. Carries the fresh counts. */
  | { ok: false; reason: "BELOW_ORDERED"; ordered: Record<string, number> }
  /** An item that's archived or inactive was added. */
  | { ok: false; reason: "UNAVAILABLE_ITEM" }

type LockedDay = { id: string; isOpen: boolean; maxOrders: number; overbookLimit: number }

function newDay(date: IsoDate, settings: PlanSettings) {
  return {
    date: toDbDate(date),
    cutoffAt: computeCutoffAt(date, settings.defaultCutoffTime, settings.defaultCutoffDays, settings.timezone),
    cutoffTime: settings.defaultCutoffTime,
    cutoffDaysBefore: settings.defaultCutoffDays,
    maxOrders: settings.defaultMaxOrders,
    overbookLimit: Math.max(settings.defaultOverbook, settings.defaultMaxOrders),
  }
}

/** Creates the day from the defaults when it was never planned, then locks it. */
async function lockOrCreateDay(tx: Tx, date: IsoDate, settings: PlanSettings): Promise<LockedDay> {
  await tx.menuDay.createMany({ data: [newDay(date, settings)], skipDuplicates: true })
  const [day] = await tx.$queryRaw<LockedDay[]>`
    SELECT id, "isOpen", "maxOrders", "overbookLimit" FROM menu_days WHERE date = ${toDbDate(date)} FOR UPDATE`
  return day
}

async function liveOrders(tx: Tx, menuDayId: string): Promise<DayOrder[]> {
  const rows = await tx.order.findMany({
    where: { menuDayId, status: { in: [...LIVE_STATUSES] } },
    select: { id: true, code: true, customerName: true },
    orderBy: { createdAt: "asc" },
  })
  return rows.map((row) => ({ id: row.id, code: row.code, name: row.customerName }))
}

function cutoffData(date: IsoDate, cutoff: CutoffChoice, timezone: string) {
  return {
    cutoffTime: cutoff.time,
    cutoffDaysBefore: cutoff.daysBefore,
    cutoffAt: computeCutoffAt(date, cutoff.time, cutoff.daysBefore, timezone),
  }
}

// ── One day, from a week card ───────────────────────────────────────────────

export type DayPatch = { isOpen?: boolean; cutoff?: CutoffChoice; maxOrders?: number }

/**
 * A week card's switch, cutoff or max — saved as soon as it changes. Closing a day with orders refuses
 * until the owner has seen them (`confirmClose`). The orders stay: closing only stops new ones.
 */
export async function patchDay(date: IsoDate, patch: DayPatch, confirmClose: boolean, settings: PlanSettings, today: IsoDate) {
  if (date < today) return { ok: false, reason: "PAST" } as const
  return serializable(async (tx): Promise<{ ok: true } | DayRefusal> => {
    const day = await lockOrCreateDay(tx, date, settings)
    if (patch.isOpen === false && day.isOpen && !confirmClose) {
      const orders = await liveOrders(tx, day.id)
      if (orders.length > 0) return { ok: false, reason: "HAS_ORDERS", orders }
    }
    await tx.menuDay.update({
      where: { id: day.id },
      data: {
        ...(patch.isOpen === undefined ? {} : { isOpen: patch.isOpen, ...(patch.isOpen ? { closureNote: null } : {}) }),
        ...(patch.cutoff ? cutoffData(date, patch.cutoff, settings.timezone) : {}),
        ...(patch.maxOrders === undefined ? {} : { maxOrders: patch.maxOrders, overbookLimit: Math.max(day.overbookLimit, patch.maxOrders) }),
      },
    })
    return { ok: true }
  })
}

// ── Apply to all days ───────────────────────────────────────────────────────

/** One cutoff and max for every open day of the week from today on. A day never drops below its verified orders. */
export async function applyToWeek(monday: IsoDate, cutoff: CutoffChoice, maxOrders: number, settings: PlanSettings, today: IsoDate) {
  return serializable(async (tx) => {
    let changed = 0
    for (const date of dateRange(monday, addDays(monday, 6))) {
      if (date < today) continue
      const day = await lockOrCreateDay(tx, date, settings)
      if (!day.isOpen) continue
      const verified = await tx.order.count({ where: { menuDayId: day.id, status: { in: [...VERIFIED_STATUSES] } } })
      const max = Math.max(maxOrders, verified)
      await tx.menuDay.update({
        where: { id: day.id },
        data: { ...cutoffData(date, cutoff, settings.timezone), maxOrders: max, overbookLimit: Math.max(day.overbookLimit, max) },
      })
      changed++
    }
    return { ok: true as const, changed }
  })
}

// ── Copy last week ──────────────────────────────────────────────────────────

export type CopyOptions = { quantities: boolean; prices: boolean }

/**
 * dev-docs/implementation.md 5.4 `copyWeek`. Each day of the week before `monday` lands on the same weekday:
 * open/closed, cutoff (recomputed for the new date — never copied), capacity, and its active items. Items
 * start with nothing ordered and nothing baked; quantities and price overrides only come across when
 * ticked (otherwise each item's default quantity and base price). Days already past, days with orders and
 * days whose source was never planned are skipped and returned, so the dialog can name them.
 */
export async function copyWeek(monday: IsoDate, options: CopyOptions, settings: PlanSettings, today: IsoDate) {
  const from = addDays(monday, -7)
  const sunday = addDays(monday, 6)
  return serializable(async (tx) => {
    // Lock the target week's existing days before reading anything about them.
    await tx.$queryRaw`SELECT id FROM menu_days WHERE date BETWEEN ${toDbDate(monday)} AND ${toDbDate(sunday)} ORDER BY date FOR UPDATE`

    const days = await tx.menuDay.findMany({
      where: { date: { gte: toDbDate(from), lte: toDbDate(sunday) } },
      include: { items: { include: { menuItem: { select: { isActive: true, archivedAt: true, defaultQuantity: true } } } } },
    })
    const byDate = new Map(days.map((day) => [fromDbDate(day.date), day]))
    const targetIds = days.filter((day) => fromDbDate(day.date) >= monday).map((day) => day.id)
    const live = await tx.order.groupBy({ by: ["menuDayId"], where: { menuDayId: { in: targetIds }, status: { in: [...LIVE_STATUSES] } }, _count: true })
    const liveBy = new Map(live.map((row) => [row.menuDayId, row._count]))

    const copyable = (day: (typeof days)[number]) => day.items.filter((row) => row.menuItem.isActive && !row.menuItem.archivedAt)
    const facts = (date: IsoDate, asSource: boolean): CopyDayFacts => {
      const day = byDate.get(date)
      return {
        date,
        planned: Boolean(day),
        isOpen: day?.isOpen ?? true,
        liveOrders: day && !asSource ? (liveBy.get(day.id) ?? 0) : 0,
        items: day ? (asSource ? copyable(day).length : day.items.length) : 0,
      }
    }
    const source = new Map(dateRange(from, addDays(monday, -1)).map((date) => [date, facts(date, true)]))
    const rows = planWeekCopy(
      dateRange(monday, sunday).map((date) => facts(date, false)),
      source,
      today,
    )

    let copied = 0
    for (const row of rows) {
      if (!row.change) continue
      const original = byDate.get(addDays(row.date, -7))
      if (!original) continue
      const settled = {
        isOpen: original.isOpen,
        closureNote: original.isOpen ? null : original.closureNote,
        ...cutoffData(row.date, { time: original.cutoffTime, daysBefore: original.cutoffDaysBefore }, settings.timezone),
        maxOrders: original.maxOrders,
        overbookLimit: original.overbookLimit,
      }
      const target = byDate.get(row.date)
      const targetId = target
        ? (await tx.menuDay.update({ where: { id: target.id }, data: settled, select: { id: true } })).id
        : (await tx.menuDay.create({ data: { date: toDbDate(row.date), ...settled }, select: { id: true } })).id

      // No live orders on the day, so nothing is ordered on its items — the guard is belt and braces.
      await tx.menuDayItem.deleteMany({ where: { menuDayId: targetId, quantityOrdered: 0 } })
      if (original.isOpen) {
        await tx.menuDayItem.createMany({
          data: copyable(original).map((item) => ({
            menuDayId: targetId,
            menuItemId: item.menuItemId,
            quantityAvailable: options.quantities ? item.quantityAvailable : item.menuItem.defaultQuantity,
            priceOverridePaise: options.prices ? item.priceOverridePaise : null,
          })),
          skipDuplicates: true,
        })
      }
      copied++
    }
    return { ok: true as const, copied, skipped: rows.filter((row): row is CopyRow & { skip: NonNullable<CopyRow["skip"]> } => Boolean(row.skip)) }
  })
}

// ── The day editor ──────────────────────────────────────────────────────────

export type DayRecord = {
  isOpen: boolean
  cutoff: CutoffChoice
  maxOrders: number
  overbookLimit: number
  publicNote: string
  closureNote: string
  /** Every item that should be on the day. Anything on it now and missing here comes off. */
  items: { menuItemId: string; quantityAvailable: number; priceOverridePaise: number | null }[]
}

/**
 * Saves the whole day. Refuses — never clamps — when a quantity is below what's ordered or an ordered item
 * is taken off; the counts come back fresh, because orders may have arrived since the editor opened.
 */
export async function saveDay(date: IsoDate, record: DayRecord, confirmClose: boolean, settings: PlanSettings, today: IsoDate) {
  if (date < today) return { ok: false, reason: "PAST" } as const
  return serializable(async (tx): Promise<{ ok: true } | DayRefusal> => {
    const day = await lockOrCreateDay(tx, date, settings)

    if (!record.isOpen && day.isOpen && !confirmClose) {
      const orders = await liveOrders(tx, day.id)
      if (orders.length > 0) return { ok: false, reason: "HAS_ORDERS", orders }
    }

    const current = await tx.menuDayItem.findMany({ where: { menuDayId: day.id }, select: { id: true, menuItemId: true, quantityOrdered: true } })
    const wanted = new Map(record.items.map((item) => [item.menuItemId, item]))
    const ordered = Object.fromEntries(current.map((row) => [row.menuItemId, row.quantityOrdered]))
    const below = current.some((row) => row.quantityOrdered > 0 && (wanted.get(row.menuItemId)?.quantityAvailable ?? -1) < row.quantityOrdered)
    if (below) return { ok: false, reason: "BELOW_ORDERED", ordered }

    const onDay = new Set(current.map((row) => row.menuItemId))
    const added = record.items.filter((item) => !onDay.has(item.menuItemId)).map((item) => item.menuItemId)
    if (added.length > 0) {
      const available = await tx.menuItem.count({ where: { id: { in: added }, isActive: true, archivedAt: null } })
      if (available !== added.length) return { ok: false, reason: "UNAVAILABLE_ITEM" }
    }

    await tx.menuDay.update({
      where: { id: day.id },
      data: {
        isOpen: record.isOpen,
        closureNote: record.isOpen ? null : record.closureNote || null,
        ...cutoffData(date, record.cutoff, settings.timezone),
        maxOrders: record.maxOrders,
        overbookLimit: Math.max(record.overbookLimit, record.maxOrders),
        publicNote: record.publicNote || null,
      },
    })

    const removed = current.filter((row) => !wanted.has(row.menuItemId)).map((row) => row.id)
    if (removed.length > 0) await tx.menuDayItem.deleteMany({ where: { id: { in: removed }, quantityOrdered: 0 } })
    for (const item of record.items) {
      if (onDay.has(item.menuItemId)) {
        await tx.menuDayItem.update({
          where: { menuDayId_menuItemId: { menuDayId: day.id, menuItemId: item.menuItemId } },
          data: { quantityAvailable: item.quantityAvailable, priceOverridePaise: item.priceOverridePaise },
        })
      }
    }
    const fresh = record.items.filter((item) => !onDay.has(item.menuItemId))
    if (fresh.length > 0) await tx.menuDayItem.createMany({ data: fresh.map((item) => ({ menuDayId: day.id, ...item })) })
    return { ok: true }
  })
}
