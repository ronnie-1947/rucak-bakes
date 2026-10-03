/** The day sheet's tickable rows, named the same on server and client. Client-safe. */

export type TickKind = "bake" | "collect"

/** One tickable row: a day item (bake) or an order (collect). `label` names it in the undo line. */
export type Tick = { kind: TickKind; id: string; label: string }

/** The key a tick's state is stored under — the server builds the map, the provider reads it. */
export function tickKey(kind: TickKind, id: string): string {
  return `${kind}:${id}`
}
