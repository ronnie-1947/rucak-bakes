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
 * Back to the week, the day with its saved Open / Closed badge (red when closed with orders), and ‹ › to the next day —
 * one row at every width. Copy from another day is a link under the title (shortened below 375px) and a button beside it
 * from 1280px, where it fits beside an H1 day. `max-xl:hidden`, not `hidden xl:inline-flex`: Button's own `inline-flex`
 * sorts after `hidden` and would win.
 */
export function DayHeader({ title, badge, backHref, prevHref, nextHref, onCopy, onLeave, dict }: DayHeaderProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <Link
          href={backHref}
          onClick={(event) => onLeave(event, backHref)}
          aria-label={dict.back}
          className="grid size-11 shrink-0 place-items-center rounded-button hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
        >
          <Icon name="chevronLeft" className="size-5" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <h1 className="text-h2 tabular-nums md:text-h1">{title}</h1>
          <span className={`inline-flex items-center gap-1 rounded-chip px-2 text-micro font-semibold ${badges[badge]}`}>
            <span aria-hidden className={`size-1.5 rounded-pill ${dots[badge]}`} />
            {badge === "open" ? dict.open : dict.closed}
          </span>
        </div>
        {onCopy ? (
          <Button variant="outlineLink" size="sm" className="mr-1 shrink-0 max-xl:hidden" onClick={onCopy}>
            <Icon name="copy" className="size-4" />
            <span>{dict.copyFrom}</span>
          </Button>
        ) : null}
        <div className="flex shrink-0 gap-1">
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
        <Button variant="link" size="inline" className="ml-12 self-start xl:hidden" onClick={onCopy}>
          <Icon name="copy" className="size-4" />
          <span className="xxs:hidden">{dict.copyFromShort}</span>
          <span className="max-xxs:hidden">{dict.copyFrom}</span>
        </Button>
      ) : null}
    </div>
  )
}
