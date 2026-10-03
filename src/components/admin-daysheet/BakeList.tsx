import type { BakeGroup } from "@/lib/daysheet/queries"
import { BakeSection } from "./BakeSection"
import { TickProgress } from "./TickProgress"
import type { DaySheetCopy } from "./types"

type BakeListProps = {
  /** Groups already narrowed to the rows this view shows. */
  groups: BakeGroup[]
  showPending: boolean
  dict: DaySheetCopy
  className?: string
}

/** "What to bake": progress across every tickable row, then each category. */
export function BakeList({ groups, showPending, dict, className }: BakeListProps) {
  const ids = groups.flatMap((group) => group.rows.flatMap((row) => (row.tickId ? [row.tickId] : [])))

  return (
    <section className={`flex min-w-0 flex-col gap-3 ${className ?? ""}`}>
      <h2 className="text-h1">{dict.bakeTitle}</h2>
      <TickProgress
        kind="bake"
        ids={ids}
        template={ids.length === 1 ? dict.bakeProgressOne : dict.bakeProgress}
        meterLabel={dict.bakeProgressLabel}
        dict={dict}
      />
      {groups.map((group) => (
        <BakeSection key={group.name ?? ""} title={group.name ?? dict.uncategorised} rows={group.rows} showPending={showPending} dict={dict} />
      ))}
    </section>
  )
}
