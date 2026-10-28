import { Skeleton } from "@/components/ui/Skeleton"

type OrderSkeletonProps = {
  /** "Loading pickup dates…" — for screen readers; the blocks are decorative. */
  label: string
}

const DATES = [0, 1, 2, 3, 4, 5]

/** The order panel's shape — the date strip and Add to cart — while the live dates are fetched. In the static HTML. */
export function OrderSkeleton({ label }: OrderSkeletonProps) {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">{label}</span>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-24 rounded-chip" />
        <div className="flex gap-2 overflow-hidden">
          {DATES.map((date) => (
            <Skeleton key={date} className="h-16 w-14 shrink-0 rounded-button" />
          ))}
        </div>
      </div>
      <Skeleton className="h-12 rounded-button" />
    </div>
  )
}
