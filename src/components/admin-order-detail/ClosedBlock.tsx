import { Notice } from "@/components/ui/Notice"
import type { OrderDetailData } from "@/lib/orders/queries"
import { fill } from "@/lib/template"
import type { DetailCopy } from "./types"

type ClosedBlockProps = {
  closed: NonNullable<OrderDetailData["closed"]>
  dict: DetailCopy
}

/** Replaces the timeline once an order is cancelled or a no-show: who, when, and why. */
export function ClosedBlock({ closed, dict }: ClosedBlockProps) {
  const noShow = closed.status === "NO_SHOW"
  const title = closed.by
    ? fill(noShow ? dict.closedNoShow : dict.closedCancelled, { by: closed.by })
    : noShow
      ? dict.closedNoShowNoBy
      : dict.closedCancelledNoBy
  const meta = [closed.at, closed.note].filter(Boolean).join(" · ")
  return (
    <Notice tone="error" title={title}>
      {meta ? <span className="text-small-admin text-foreground">{meta}</span> : null}
    </Notice>
  )
}
