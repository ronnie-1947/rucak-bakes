import { CheckIcon } from "@/components/ui/icons/CheckIcon"
import type { OrderStatus } from "@/generated/prisma/enums"
import type { OrderDetailData } from "@/lib/orders/queries"
import type { AdminCopy } from "./types"

type TimelineProps = {
  timeline: OrderDetailData["timeline"]
  status: OrderStatus
  dict: AdminCopy
}

type Step = "done" | "current" | "todo"

const dots: Record<Step, string> = {
  done: "border-green bg-green text-background",
  current: "border-o500 bg-o500 text-background",
  todo: "border-border-strong bg-background text-background",
}

const labels: Record<Step, string> = {
  done: "font-semibold text-green",
  current: "font-semibold text-foreground",
  todo: "font-medium text-muted",
}

/** Pending → Verified → Ready → Completed, with the time each happened. A completed order is all green. */
export function Timeline({ timeline, status, dict }: TimelineProps) {
  const index = timeline.findIndex((step) => step.status === status)
  const finished = index === timeline.length - 1

  return (
    <ol aria-label={dict.orderDetail.timelineLabel} className="relative grid grid-cols-4">
      <span aria-hidden className="absolute top-2 right-1/8 left-1/8 h-0.5 bg-border" />
      {timeline.map((step, i) => {
        const state: Step = i < index || finished ? "done" : i === index ? "current" : "todo"
        return (
          <li key={step.status} aria-current={i === index ? "step" : undefined} className="relative flex flex-col items-center gap-1 text-center">
            <span className={`flex size-5 items-center justify-center rounded-pill border-2 ${dots[state]}`}>
              {state === "done" ? <CheckIcon className="size-3" /> : null}
            </span>
            <span className={`text-small-admin ${labels[state]}`}>{dict.orderStatus[step.status]}</span>
            <span className="text-micro text-muted">{state === "current" && !finished ? dict.orderDetail.now : (step.at?.split(", ")[1] ?? "")}</span>
          </li>
        )
      })}
    </ol>
  )
}
