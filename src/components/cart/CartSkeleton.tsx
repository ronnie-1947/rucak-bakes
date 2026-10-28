import { Skeleton } from "@/components/ui/Skeleton"
import { StepLayout } from "./StepLayout"

type CartSkeletonProps = {
  /** "Opening your cart…" — for screen readers; the blocks are decorative. */
  label: string
}

const LINES = [0, 1]

/** The cart step's shape — heading, day card, lines, the side card — until the browser has read the cart. Static: it's in the HTML. */
export function CartSkeleton({ label }: CartSkeletonProps) {
  return (
    <div role="status" className="mx-auto flex w-full max-w-3xl flex-col gap-6 lg:max-w-5xl">
      <span className="sr-only">{label}</span>
      <div className="flex min-h-11 items-center">
        <Skeleton className="h-6 w-40 rounded-chip" />
      </div>
      <StepLayout
        main={
          <>
            <Skeleton tone="warm" className="h-24 rounded-card lg:hidden" />
            <ul className="divide-y divide-border border-y border-border">
              {LINES.map((line) => (
                <li key={line} className="flex gap-3 py-3">
                  <Skeleton className="size-14 shrink-0 rounded-card" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
                    <Skeleton className="h-4 w-3/5 rounded-chip" />
                    <Skeleton className="h-3 w-2/5 rounded-chip" />
                  </div>
                </li>
              ))}
            </ul>
            <Skeleton className="h-12 rounded-button" />
          </>
        }
        side={
          <>
            <Skeleton tone="warm" className="h-24 rounded-card" />
            <Skeleton className="h-4 w-1/2 rounded-chip" />
            <Skeleton className="h-12 rounded-button" />
          </>
        }
      />
    </div>
  )
}
