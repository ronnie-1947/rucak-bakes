import { addDays, type IsoDate } from "@/lib/dates"
import {
  type BookingDay,
  type BookingWindow,
  deadlineFor,
  earliestDate,
  lineTooSoon,
  longestNotice,
  ordersLeft,
  pastCutoff,
} from "@/lib/orders/deadline"
import type { Cart, CartLine } from "./cart"

/**
 * The cart checked against the live menu and the booking window (dev-docs/implementation.md 6.3 "revalidate on mount", as §10R
 * reworked it). The server answers with a CartCheck (storefront/cart.ts `checkLines`); `reconcile` applies it, and the views
 * below judge the cart's day with the one deadline rule (orders/deadline.ts). Client-safe, pure.
 *
 * There is no stock: any orderable item can be ordered for any date at least its notice away.
 */

/** One cart line as the menu has it now. */
export type LineCheck = {
  menuItemId: string
  slug: string
  name: string
  image: string | null
  /** Active, not archived and orderable online — placeOrder takes it. */
  orderable: boolean
  /** The menu price — display only. */
  pricePaise: number
  noticeDays: number
}

export type CartCheck = {
  /** Lines whose item no longer exists are missing. */
  lines: LineCheck[]
  /** The booking window as it stands now — the day card and Change day. */
  window: BookingWindow
}

/** What changed on a line since it was added — a tag beside its price. */
export type LineNote = "price"

export type Reconciled = {
  cart: Cart | null
  notes: Record<string, LineNote>
  /** Names of lines taken out — the item can't be ordered online any more. */
  removed: string[]
}

/** A line's notice; an older cart line without one counts as none until the check fills it in. */
export function lineNotice(line: CartLine): number {
  return line.noticeDays ?? 0
}

/** The cart as `check` says it stands: lines that can't be ordered removed; prices, names, photos and notices refreshed. */
export function reconcile(cart: Cart, check: CartCheck, now: number): Reconciled {
  const byId = new Map(check.lines.map((line) => [line.menuItemId, line]))
  const notes: Record<string, LineNote> = {}
  const removed: string[] = []

  const items = cart.items.flatMap((line): CartLine[] => {
    const fresh = byId.get(line.menuItemId)
    if (!fresh?.orderable) {
      removed.push(fresh?.name ?? line.name)
      return []
    }
    if (fresh.pricePaise !== line.priceSnapshot) notes[line.menuItemId] = "price"
    return [
      {
        menuItemId: line.menuItemId,
        slug: fresh.slug,
        name: fresh.name,
        priceSnapshot: fresh.pricePaise,
        imageId: fresh.image,
        qty: line.qty,
        noticeDays: fresh.noticeDays,
      },
    ]
  })

  const unchanged = removed.length === 0 && items.every((line, index) => sameLine(line, cart.items[index]))
  const next = unchanged ? cart : items.length > 0 ? { items, fulfilmentDate: cart.fulfilmentDate, updatedAt: now } : null
  return { cart: next, notes, removed }
}

function sameLine(a: CartLine, b: CartLine | undefined): boolean {
  return Boolean(
    b &&
    a.menuItemId === b.menuItemId &&
    a.qty === b.qty &&
    a.priceSnapshot === b.priceSnapshot &&
    a.name === b.name &&
    a.slug === b.slug &&
    a.imageId === b.imageId &&
    a.noticeDays === b.noticeDays,
  )
}

/**
 * Whether the cart's day as a whole can take the order — the day card's alert, and Place order waits on it. Lines too soon on
 * their own notice are flagged one by one instead (`CartDayView.tooSoon`); the server refuses them with TOO_SOON.
 */
export type CartDayStatus = "open" | "paused" | "closed" | "cutoff" | "full"

export type CartDayView = {
  status: CartDayStatus
  /** The cart's date in the window; null once it has left it (gone by, or too far ahead). */
  day: BookingDay | null
  /** Lines whose notice makes the date too soon — never when the day's own cutoff has passed (that's the day's problem). */
  tooSoon: CartLine[]
  /** When ordering closes for the lines that fit — the earliest of their deadlines, epoch ms. Null when none fit. */
  deadline: number | null
  /** The first other date of the window that takes every line. */
  earliest: IsoDate | null
}

export function viewCartDay(cart: Cart, window: BookingWindow): CartDayView {
  const date = cart.fulfilmentDate
  const day = window.days.find((entry) => entry.date === date) ?? null
  const earliest = earliestDate(cart.items.map(lineNotice), window, date)
  const status: CartDayStatus = window.paused
    ? "paused"
    : !day
      ? date < window.today
        ? "cutoff"
        : "closed"
      : !day.isOpen
        ? "closed"
        : pastCutoff(day, window.now)
          ? "cutoff"
          : day.taken >= day.overbookLimit
            ? "full"
            : "open"
  if (!day || status === "closed" || status === "cutoff") return { status, day, tooSoon: [], deadline: null, earliest }

  const tooSoon = cart.items.filter((line) => lineTooSoon(day, lineNotice(line), window))
  const fitting = cart.items.filter((line) => !tooSoon.includes(line))
  const deadline = fitting.length > 0 ? deadlineFor(day, fitting.map(lineNotice), window.timeZone) : null
  return { status, day, tooSoon, deadline, earliest }
}

/** Why a Change day row can't be picked — in the sheet's precedence: closed › full › past cutoff › too soon for a line. */
export type SheetDayState = "open" | "paused" | "closed" | "full" | "cutoff" | "tooSoon"

export type SheetDay = {
  date: IsoDate
  isCurrent: boolean
  state: SheetDayState
  /** Orders the day still accepts. */
  left: number
  /** When ordering every line for that day closes, epoch ms. */
  deadline: number
  /** The longest-notice line too soon for that day — "Too soon for Custom birthday cake". */
  blocker: CartLine | null
}

/** The Change day rows: tomorrow to the end of the window (and the cart's own day if it is today). */
export function sheetDays(cart: Cart, window: BookingWindow): SheetDay[] {
  const tomorrow = addDays(window.today, 1)
  return window.days
    .filter((day) => day.date >= tomorrow || day.date === cart.fulfilmentDate)
    .map((day): SheetDay => {
      const late = cart.items.filter((line) => lineTooSoon(day, lineNotice(line), window))
      const blocker = longestNotice(late.map((line) => ({ ...line, noticeDays: lineNotice(line) })))
      const state: SheetDayState = window.paused
        ? "paused"
        : !day.isOpen
          ? "closed"
          : day.taken >= day.overbookLimit
            ? "full"
            : pastCutoff(day, window.now)
              ? "cutoff"
              : blocker
                ? "tooSoon"
                : "open"
      return {
        date: day.date,
        isCurrent: day.date === cart.fulfilmentDate,
        state,
        left: ordersLeft(day),
        deadline: deadlineFor(day, cart.items.map(lineNotice), window.timeZone),
        blocker,
      }
    })
}
