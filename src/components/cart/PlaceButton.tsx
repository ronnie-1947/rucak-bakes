import { Button } from "@/components/ui/Button"
import { Spinner } from "@/components/ui/Spinner"

type PlaceButtonProps = {
  /** "Place order · ₹660". */
  label: string
  /** Read out while the order is on its way. */
  busyLabel: string
  busy: boolean
  onPlace: () => void
  className?: string
}

/**
 * Place order. While it sends it keeps its full colour with a spinner (aria-busy) and ignores further taps —
 * a double tap would only resend the same idempotency key, but it shouldn't look possible.
 */
export function PlaceButton({ label, busyLabel, busy, onPlace, className }: PlaceButtonProps) {
  return (
    <Button
      size="lg"
      aria-busy={busy || undefined}
      onClick={() => (busy ? undefined : onPlace())}
      className={`font-semibold tabular-nums ${className ?? ""}`}
    >
      {busy ? (
        <>
          <Spinner tone="inverse" />
          <span className="sr-only">{busyLabel}</span>
        </>
      ) : (
        label
      )}
    </Button>
  )
}
