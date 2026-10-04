import { CallLink } from "@/components/ui/CallLink"

type CallBlockProps = {
  /** "We make this to order — call us to talk it through." / "No dates open right now — …" */
  text: string
  /** E.164 — the line alone without one. */
  phone: string | null
  /** "Call +91 98765 43210" */
  callLabel: string
}

/** In place of the date strip and Add: a call-only item, or no date that can take the order. A 48px Call. */
export function CallBlock({ text, phone, callLabel }: CallBlockProps) {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-sunken p-4">
      <p className="font-medium text-pretty">{text}</p>
      {phone ? <CallLink phone={phone} label={callLabel} variant="primary" size="lg" className="w-full" /> : null}
    </div>
  )
}
