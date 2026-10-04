import { CallLink } from "@/components/ui/CallLink"

type CounterBlockProps = {
  /** "On the counter today — walk in till 4pm or call" */
  text: string
  /** E.164 — no Call link without one. */
  phone: string | null
  /** "Call" */
  callLabel: string
  /** "Call +91 98765 43210" — the link's accessible name. */
  callAria: string
}

/** On today's counter too (§10R): walk in for it, or call — a green-soft line above the date strip. */
export function CounterBlock({ text, phone, callLabel, callAria }: CounterBlockProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-button bg-green-soft py-2 pr-2 pl-4">
      <span className="font-medium text-pretty text-green">{text}</span>
      {phone ? <CallLink phone={phone} label={callLabel} ariaLabel={callAria} variant="link" className="px-2" /> : null}
    </div>
  )
}
