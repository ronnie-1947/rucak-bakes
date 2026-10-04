type AvailabilityLineProps = {
  /** "Pickup Saturday 10 Oct · order by Friday 6pm" */
  line: string
  /** "Only 2 orders left that day" */
  fewLeft: string | null
}

/**
 * The picked date — after the price, the thing a customer most needs, so it's body-size semibold ink, not a grey caption. A
 * green dot leads it; "Only 2 orders left that day" follows in the accent when the day is nearly full. Announced politely
 * when the date changes.
 */
export function AvailabilityLine({ line, fewLeft }: AvailabilityLineProps) {
  return (
    <div aria-live="polite" className="flex flex-col gap-0.5">
      <p className="flex items-start gap-2 font-semibold text-pretty tabular-nums">
        <span aria-hidden className="mt-2 size-2 shrink-0 rounded-pill bg-green" />
        <span>{line}</span>
      </p>
      {fewLeft ? <p className="pl-4 text-small font-semibold text-o700">{fewLeft}</p> : null}
    </div>
  )
}
