import Link from "next/link"
import type { MouseEvent } from "react"
import { Button, buttonClasses } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import type { DayCopy } from "./types"

type Badge = "open" | "closedWithOrders" | "closed"

type DayHeaderProps = {
  title: string
  badge: Badge
  backHref: string
  prevHref: string | null
  nextHref: string | null
  /** Hidden on past days. */
  onCopy: (() => void) | null
  /** Every way out goes through here — with unsaved changes it opens the leave dialog instead. */
  onLeave: (event: MouseEvent<HTMLAnchorElement>, href: string) => void
  dict: DayCopy
}

const badges: Record<Badge, string> = {
  open: "bg-green-soft text-green",
  closedWithOrders: "bg-red-soft text-red",
  closed: "bg-sunken text-muted",
}

const dots: Record<Badge, string> = {
  open: "bg-green",
  closedWithOrders: "bg-red",
  closed: "bg-muted",
}

const arrow = buttonClasses("outline", "sm", "w-11 shrink-0 px-0")

/**
 * Back to the week, the day with its saved Open / Closed badge (red when closed with orders), Copy from
 * another day (beside the title from 768px, full width under it on phones), and ‹ › to the next day.
 */
export function DayHeader({ title, badge, backHref, prevHref, nextHref, onCopy, onLeave, dict }: DayHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <Link
          href={backHref}
          onClick={(event) => onLeave(event, backHref)}
          aria-label={dict.back}
          className="grid size-11 shrink-0 place-items-center rounded-button hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
        >
          <Icon name="chevronLeft" className="size-5.5" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-x-3 gap-y-1 pt-2 md:flex-row md:flex-wrap md:items-center">
          <h1 className="text-h1 tabular-nums">{title}</h1>
          <span className={`inline-flex items-center gap-2 rounded-chip px-2 text-micro font-semibold ${badges[badge]}`}>
            <span aria-hidden className={`size-1.5 rounded-pill ${dots[badge]}`} />
            {badge === "open" ? dict.open : dict.closed}
          </span>
        </div>
        {onCopy ? (
          <Button variant="outlineLink" className="hidden shrink-0 md:inline-flex" onClick={onCopy}>
            <Icon name="copy" className="size-4.5" />
            <span>{dict.copyFrom}</span>
          </Button>
        ) : null}
        <div className="flex shrink-0 gap-2">
          {prevHref ? (
            <Link href={prevHref} onClick={(event) => onLeave(event, prevHref)} aria-label={dict.prevDay} className={arrow}>
              <Icon name="chevronLeft" className="size-4.5" strokeWidth={2.2} />
            </Link>
          ) : (
            <span aria-disabled className={`${arrow} opacity-40`}>
              <Icon name="chevronLeft" className="size-4.5" strokeWidth={2.2} />
            </span>
          )}
          {nextHref ? (
            <Link href={nextHref} onClick={(event) => onLeave(event, nextHref)} aria-label={dict.nextDay} className={arrow}>
              <Icon name="chevronRight" className="size-4.5" strokeWidth={2.2} />
            </Link>
          ) : (
            <span aria-disabled className={`${arrow} opacity-40`}>
              <Icon name="chevronRight" className="size-4.5" strokeWidth={2.2} />
            </span>
          )}
        </div>
      </div>
      {onCopy ? (
        <Button variant="outlineLink" className="w-full md:hidden" onClick={onCopy}>
          <Icon name="copy" className="size-4.5" />
          <span>{dict.copyFrom}</span>
        </Button>
      ) : null}
    </div>
  )
}
