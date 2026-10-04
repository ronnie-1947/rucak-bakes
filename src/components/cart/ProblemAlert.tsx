import type { ReactNode } from "react"
import { Icon } from "@/components/ui/icons/Icon"

type ProblemAlertProps = {
  /** "Saturday is now fully booked". */
  title: string
  /** What happened and what's kept. */
  body?: ReactNode
  /** The way forward — Move to Sunday, Remove it and continue, Call. */
  action?: ReactNode
}

/** Something stops the order: a red block in the flow, announced, with the one action that fixes it. Never a toast. */
export function ProblemAlert({ title, body, action }: ProblemAlertProps) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-card border border-red bg-red-soft p-4">
      <div className="flex items-start gap-3">
        <Icon name="alert" className="size-5 shrink-0 text-red" />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-semibold text-pretty text-red">{title}</span>
          {body ? <span className="text-small text-pretty">{body}</span> : null}
        </div>
      </div>
      {action}
    </div>
  )
}
