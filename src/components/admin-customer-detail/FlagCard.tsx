"use client"

import { CustomerActionsStatus } from "@/components/customer-actions/CustomerActionsStatus"
import { Switch } from "@/components/ui/Switch"
import { useCustomerActions } from "@/hooks/useCustomerActions"
import type { CustomerDetailData } from "@/lib/customers/detail"
import { fill } from "@/lib/template"
import type { AdminCopy } from "./types"

type FlagCardProps = {
  customer: CustomerDetailData
  dict: AdminCopy
  /** The page shows the undo strip here; in the list's pane the list's own strip shows it. */
  showStatus: boolean
}

const resting: Record<"locked" | "free", string> = {
  locked: "opacity-45",
  free: "",
}

/**
 * Trusted and Blocked, each with the line saying what it means for their orders. They never sit together:
 * while one is on, the other rests and says what to do first. Every change confirms, then leaves an undo.
 */
export function FlagCard({ customer, dict, showStatus }: FlagCardProps) {
  const { request, pending } = useCustomerActions()
  const f = dict.customerDetail.flags
  const target = { id: customer.id, name: customer.name, phoneDisplay: customer.phoneDisplay }
  const trustHelp = customer.isBlocked ? f.trustLocked : customer.autoVerifyTrusted ? f.trustHelp : f.trustHelpManual
  const blockHelp = customer.isTrusted ? f.blockLocked : f.blockHelp

  return (
    <section className="flex flex-col gap-3 rounded-panel border border-border p-3">
      <div className={`flex flex-col gap-1 ${resting[customer.isBlocked ? "locked" : "free"]}`}>
        <Switch
          checked={customer.isTrusted}
          disabled={customer.isBlocked || pending}
          onChange={() => request(customer.isTrusted ? "untrust" : "trust", target)}
          stateLabel={customer.isTrusted ? f.trusted : f.notTrusted}
          label={fill(f.trustLabel, { name: customer.name })}
          className="self-start"
        />
        <span className="text-small-admin text-pretty text-muted">{trustHelp}</span>
      </div>
      <div className={`flex flex-col gap-1 ${resting[customer.isTrusted ? "locked" : "free"]}`}>
        <Switch
          checked={customer.isBlocked}
          disabled={customer.isTrusted || pending}
          onChange={() => request(customer.isBlocked ? "unblock" : "block", target)}
          stateLabel={customer.isBlocked ? f.blocked : f.notBlocked}
          label={fill(f.blockLabel, { name: customer.name })}
          tone="danger"
          className="self-start"
        />
        <span className="text-small-admin text-pretty text-muted">{blockHelp}</span>
      </div>
      {showStatus ? <CustomerActionsStatus dict={dict.customerActions} /> : null}
    </section>
  )
}
