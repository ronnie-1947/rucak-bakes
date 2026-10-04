import { Meter } from "@/components/ui/Meter"
import type { DayOption, LineTone } from "./availability"

type AvailabilityLineProps = {
  line: string
  tone: LineTone
  meter: DayOption["meter"]
}

const dots: Record<LineTone, string> = {
  green: "bg-green",
  red: "bg-red",
  muted: "bg-muted",
}

/**
 * The selected day's availability — after the price, the thing a customer most needs, so it's body-size ink,
 * not a grey caption. A coloured dot leads it (the words carry the meaning); the bar shows how much of the
 * day's batch is already ordered. Announced politely when the day changes.
 */
export function AvailabilityLine({ line, tone, meter }: AvailabilityLineProps) {
  return (
    <>
      <p aria-live="polite" className="flex items-start gap-2 text-pretty">
        <span aria-hidden className={`mt-2 size-2 shrink-0 rounded-pill ${dots[tone]}`} />
        <span>{line}</span>
      </p>
      {meter ? <Meter value={meter.value} max={meter.max} label={meter.label} /> : null}
    </>
  )
}
