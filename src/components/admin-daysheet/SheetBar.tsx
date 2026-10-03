import Link from "next/link"
import { buttonClasses } from "@/components/ui/Button"
import { Container } from "@/components/ui/Container"
import { Icon } from "@/components/ui/icons/Icon"
import type { DaySheetData } from "@/lib/daysheet/queries"
import { DateJump } from "./DateJump"
import { PrintButton } from "./PrintButton"
import { SheetWatcher } from "./SheetWatcher"
import type { DaySheetCopy } from "./types"

type SheetBarProps = {
  data: DaySheetData
  dict: DaySheetCopy
}

const arrow = buttonClasses("outline", "sm", "w-11 shrink-0 px-0")

/**
 * Sticky at the top of `main`: ‹ the day ›, back to Today, a date picker from 1024px, and Print. On phones the
 * title sits centred between the arrows and the rest wraps to a second row. The new-order line rides in here
 * too, so it stays in view.
 */
export function SheetBar({ data, dict }: SheetBarProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background shadow-raised">
      <Container className="flex flex-col gap-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 basis-full items-center gap-2 md:basis-auto">
            <Link href={data.hrefs.prev} aria-label={dict.prevDay} className={arrow}>
              <Icon name="chevronLeft" className="size-5" strokeWidth={2.2} />
            </Link>
            <h1 className="min-w-0 flex-1 truncate text-center text-h2 tabular-nums xxs:text-h1 md:flex-none md:text-left">{data.title}</h1>
            <Link href={data.hrefs.next} aria-label={dict.nextDay} className={arrow}>
              <Icon name="chevronRight" className="size-5" strokeWidth={2.2} />
            </Link>
          </div>
          {data.isToday ? null : (
            <Link href={data.hrefs.today} className={buttonClasses("link", "md", "px-2")}>
              {dict.today}
            </Link>
          )}
          <DateJump params={data.params} today={data.today} label={dict.jumpTo} className="hidden lg:block" />
          <span className="flex-1" />
          <PrintButton label={dict.print} />
        </div>
        <SheetWatcher key={data.version.orders.join(",")} date={data.params.date} version={data.version} live={!data.isPast} dict={dict} />
      </Container>
    </div>
  )
}
