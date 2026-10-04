import { type Cart, CART_KEY, parseCart } from "./cart"

/**
 * The cart as an external store for useSyncExternalStore: one in-memory snapshot, read from localStorage on
 * first use and kept in step with other tabs through the `storage` event. Browser-only at call time; the
 * server snapshot is an empty cart. Storage can be missing or throw (private mode, blocked site data) —
 * the cart then lives for the page's lifetime only.
 */

let snapshot: Cart | null | undefined
const listeners = new Set<() => void>()

function read(): Cart | null {
  try {
    return parseCart(window.localStorage.getItem(CART_KEY))
  } catch {
    return null
  }
}

function emit() {
  for (const listener of listeners) listener()
}

function onStorage(event: StorageEvent) {
  if (event.key !== CART_KEY && event.key !== null) return
  snapshot = read()
  emit()
}

export function subscribeCart(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener("storage", onStorage)
  }
}

export function getCart(): Cart | null {
  if (snapshot === undefined) snapshot = read()
  return snapshot
}

export function getServerCart(): Cart | null {
  return null
}

export function writeCart(cart: Cart | null) {
  snapshot = cart
  try {
    if (cart) window.localStorage.setItem(CART_KEY, JSON.stringify(cart))
    else window.localStorage.removeItem(CART_KEY)
  } catch {
    // Storage unavailable — the in-memory snapshot still serves this page.
  }
  emit()
}
