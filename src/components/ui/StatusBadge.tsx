import type { OrderStatus } from "@/generated/prisma/enums"

type StatusBadgeProps = {
  status: OrderStatus
  /** The translated status name — colour is never the only signal. */
  label: string
  className?: string
}

const tones: Record<OrderStatus, string> = {
  PENDING: "bg-o50 text-o700",
  VERIFIED: "bg-green-soft text-green",
  READY: "bg-green-soft text-green",
  COMPLETED: "bg-sunken text-muted",
  CANCELLED: "bg-red-soft text-red",
  NO_SHOW: "bg-red-soft text-red",
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span className={`inline-flex min-h-5 shrink-0 items-center gap-1 rounded-chip px-2 text-micro font-semibold whitespace-nowrap ${tones[status]} ${className ?? ""}`}>
      {status === "READY" ? <span aria-hidden className="size-1.5 rounded-pill bg-green" /> : null}
      <span>{label}</span>
    </span>
  )
}
