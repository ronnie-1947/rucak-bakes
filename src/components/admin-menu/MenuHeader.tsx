import Link from "next/link"
import { buttonClasses } from "@/components/ui/Button"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { Container } from "@/components/ui/Container"
import { Icon } from "@/components/ui/icons/Icon"
import { type MenuFilters, menuHref } from "@/lib/menu/filters"
import { fill } from "@/lib/template"
import type { MenuCopy } from "./types"

type MenuHeaderProps = {
  dict: MenuCopy
  filters: MenuFilters
  totalCount: number
  activeCount: number
  archivedCount: number
}

/**
 * Title and counts; Archived (n) / Back to menu, Select / Done, and Add item from 768px (phones get the
 * floating button). Under it, the one line that stops the owner reading the Active switch as "on sale today".
 */
export function MenuHeader({ dict, filters, totalCount, activeCount, archivedCount }: MenuHeaderProps) {
  const archived = filters.archived
  const count = archived
    ? fill(dict.archivedCount, { count: archivedCount })
    : fill(totalCount === 1 ? dict.countOne : dict.count, { count: totalCount, active: activeCount })

  return (
    <Container className="flex flex-col gap-2 pt-6 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-h1">{archived ? dict.archivedTitle : dict.title}</h1>
          <span className="text-small-admin text-muted tabular-nums">{count}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Link href={menuHref({ ...filters, archived: !archived, select: false })} className={buttonClasses("link", "sm", "tabular-nums")}>
            {archived ? dict.backToMenu : fill(dict.archivedLink, { count: archivedCount })}
          </Link>
          {!archived && totalCount > 0 ? (
            <Link href={menuHref({ ...filters, select: !filters.select })} scroll={false} className={buttonClasses("link", "sm")}>
              {filters.select ? dict.done : dict.select}
            </Link>
          ) : null}
          {archived ? null : (
            <ButtonLink href="/admin/menu/new" variant="primary" className="ml-1 max-md:hidden">
              <Icon name="plus" className="size-4.5" strokeWidth={2.4} />
              <span>{dict.add}</span>
            </ButtonLink>
          )}
        </div>
      </div>
      <p className="text-pretty text-muted">
        {archived ? dict.archivedExplain : dict.explain}{" "}
        {archived ? null : (
          <Link href="/admin/calendar" className="font-semibold text-o700 hover:underline">
            {dict.openCalendar}
          </Link>
        )}
      </p>
    </Container>
  )
}
