import Link from "next/link"
import { buttonClasses } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import type { WeekPlan } from "@/lib/calendar/week"
import { summaryText } from "./copy"
import type { CalendarCopy } from "./types"

type WeekNavProps = {
  week: WeekPlan
  dict: CalendarCopy
}

const arrow = buttonClasses("outline", "sm", "w-11 shrink-0 px-0")

/**
 * ‹ Mon 5 – Sun 11 Oct › and This week, then the week's numbers. The arrows are links (the week lives in
 * ?week=), drawn disabled at the ends of the planner's reach.
 */
export function WeekNav({ week, dict }: WeekNavProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <nav aria-label={dict.weekNav} className="flex items-center gap-1">
        {week.prevHref ? (
          <Link href={week.prevHref} aria-label={dict.prevWeek} className={arrow}>
            <Icon name="chevronLeft" className="size-4.5" strokeWidth={2.2} />
          </Link>
        ) : (
          <span aria-disabled className={`${arrow} opacity-40`}>
            <Icon name="chevronLeft" className="size-4.5" strokeWidth={2.2} />
          </span>
        )}
        <span aria-current="page" className="min-w-38 px-2 text-center font-semibold whitespace-nowrap tabular-nums">
          {week.rangeLabel}
        </span>
        {week.nextHref ? (
          <Link href={week.nextHref} aria-label={dict.nextWeek} className={arrow}>
            <Icon name="chevronRight" className="size-4.5" strokeWidth={2.2} />
          </Link>
        ) : (
          <span aria-disabled className={`${arrow} opacity-40`}>
            <Icon name="chevronRight" className="size-4.5" strokeWidth={2.2} />
          </span>
        )}
        {week.thisWeekHref ? (
          <Link href={week.thisWeekHref} className={buttonClasses("link", "sm", "ml-1 px-2")}>
            {dict.thisWeek}
          </Link>
        ) : null}
      </nav>
      <span className="text-small-admin text-muted tabular-nums">{summaryText(week, dict)}</span>
    </div>
  )
}
