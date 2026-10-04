/** The day sheet's tickable rows, named the same on server and client. Client-safe. */

/**
 * `item` — a For orders row: every verified line of that menu item that day (`OrderItem.bakedAt`).
 * `line` — a Made to order row: that one order line. `counter` — a counter-item (`MenuDayItem.bakedAt`).
 * `collect` — an order handed over.
 */
export type TickKind = "item" | "line" | "counter" | "collect"

/** The three kinds that mark something baked. */
export type BakeKind = Exclude<TickKind, "collect">

/** One tickable row. `label` names it in the undo line. */
export type Tick = { kind: TickKind; id: string; label: string }

/** The key a tick's state is stored under — the server builds the map, the provider reads it. */
export function tickKey(kind: TickKind, id: string): string {
  return `${kind}:${id}`
}
