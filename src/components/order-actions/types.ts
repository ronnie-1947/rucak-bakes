import type { TransitionResult } from "@/app/actions/orders"
import type { ActionTarget } from "@/hooks/useOrderActions"
import type { Dict } from "@/lib/i18n"

export type OrdersCopy = Dict["admin"]["orders"]

export type OverCapacity = Extract<TransitionResult, { reason: "CAPACITY_EXCEEDED" }>["over"]

/** The one dialog open at a time. */
export type OpenDialog =
  | { kind: "cancel" | "noShow"; targets: ActionTarget[] }
  | { kind: "over"; targets: ActionTarget[]; over: OverCapacity }
