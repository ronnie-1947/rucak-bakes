import { OrderStatus } from "@/generated/prisma/enums"

/**
 * The order state machine — dev-docs/implementation.md 5.1. Client-safe (enums.ts only), so the admin
 * UI offers exactly the moves the server will accept.
 *
 *   PENDING  → VERIFIED | CANCELLED
 *   VERIFIED → READY | CANCELLED
 *   READY    → COMPLETED | NO_SHOW
 *   COMPLETED / CANCELLED / NO_SHOW are terminal
 */
export const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: [OrderStatus.VERIFIED, OrderStatus.CANCELLED],
  VERIFIED: [OrderStatus.READY, OrderStatus.CANCELLED],
  READY: [OrderStatus.COMPLETED, OrderStatus.NO_SHOW],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

/** The happy path, for the timeline. CANCELLED and NO_SHOW leave it. */
export const FLOW: readonly OrderStatus[] = [OrderStatus.PENDING, OrderStatus.VERIFIED, OrderStatus.READY, OrderStatus.COMPLETED]

/** Count against MenuDay.maxOrders at verify time. */
export const VERIFIED_STATUSES: readonly OrderStatus[] = [OrderStatus.VERIFIED, OrderStatus.READY, OrderStatus.COMPLETED]

/** Count against MenuDay.overbookLimit at submit time — everything still alive. */
export const LIVE_STATUSES: readonly OrderStatus[] = [OrderStatus.PENDING, ...VERIFIED_STATUSES]

/** Ends that release the order's quantities back onto the day. */
export const RELEASING_STATUSES: readonly OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.NO_SHOW]

export function isTerminal(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0
}
