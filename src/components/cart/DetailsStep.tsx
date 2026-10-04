import type { ReactNode } from "react"
import { ActionBar } from "./ActionBar"
import { StepLayout } from "./StepLayout"
import { SummaryRow } from "./SummaryRow"

type DetailsStepProps = {
  /** "3 items · ₹660 · Saturday, 10 Oct". */
  summaryText: string
  editLabel: string
  onEdit: () => void
  /** The day's alert or Place order's refusal. */
  alerts: ReactNode
  form: ReactNode
  dayCard: ReactNode
  summary: ReactNode
  expectation: ReactNode
  /** Place order — or, when the day can't take it, why not beside a disabled button. */
  action: ReactNode
  /** The order is on its way: the form greys and locks. */
  busy: boolean
}

const fields: Record<"busy" | "idle", string> = {
  busy: "opacity-50",
  idle: "opacity-100",
}

/** State 2 — your details. Deliberately not a checkout: no payment, no progress steps, no account. */
export function DetailsStep({ summaryText, editLabel, onEdit, alerts, form, dayCard, summary, expectation, action, busy }: DetailsStepProps) {
  return (
    <>
      <StepLayout
        main={
          <fieldset
            disabled={busy}
            className={`flex min-w-0 flex-col gap-6 transition-opacity duration-150 ease-out motion-reduce:transition-none ${fields[busy ? "busy" : "idle"]}`}
          >
            <SummaryRow text={summaryText} editLabel={editLabel} onEdit={onEdit} />
            {alerts}
            {form}
            <div className="flex flex-col gap-6 lg:hidden">
              {summary}
              {expectation}
            </div>
          </fieldset>
        }
        side={
          <>
            {dayCard}
            {summary}
            {expectation}
            {action}
          </>
        }
      />
      <ActionBar>{action}</ActionBar>
    </>
  )
}
