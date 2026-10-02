import { Meter } from "@/components/ui/Meter"
import type { CapacityData } from "@/lib/orders/queries"
import { fill } from "@/lib/template"
import type { OrdersCopy } from "./types"

type CapacityMetersProps = {
  capacity: CapacityData[]
  dict: OrdersCopy
  className?: string
}

const values: Record<"open" | "full", string> = {
  open: "font-semibold text-foreground",
  full: "font-semibold text-red",
}

/** Today and tomorrow: verified orders against maxOrders. Red, and "· full", at capacity. */
export function CapacityMeters({ capacity, dict, className }: CapacityMetersProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 md:flex md:gap-6 ${className ?? ""}`}>
      {capacity.map((day) => {
        const label = day.relative === "today" ? dict.today : dict.tomorrow
        const full = day.maxOrders !== null && day.verifiedCount >= day.maxOrders
        return (
          <div key={day.relative} className="flex min-w-24 flex-col gap-1">
            <span className="text-small-admin whitespace-nowrap">
              <span className="text-muted">{label}</span>{" "}
              {day.maxOrders === null ? (
                <span className="text-muted">{dict.capacityUnplanned}</span>
              ) : (
                <span className={values[full ? "full" : "open"]}>
                  {fill(dict.capacity, { verified: day.verifiedCount, max: day.maxOrders })}
                  {full ? dict.capacityFull : null}
                </span>
              )}
            </span>
            <Meter
              value={day.verifiedCount}
              max={day.maxOrders ?? 0}
              tone={full ? "full" : "warm"}
              label={`${label} ${fill(dict.groupCounter, { verified: day.verifiedCount, max: day.maxOrders ?? 0 })}`}
            />
          </div>
        )
      })}
    </div>
  )
}
