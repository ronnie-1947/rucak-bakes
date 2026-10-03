import Link from "next/link"
import { fill } from "@/lib/template"
import type { AdminCopy, ShellData } from "./types"

type MobileHeaderProps = {
  dict: AdminCopy
  data: ShellData
}

/** Under 768px: bakery, today, and the pending count — a tap opens the pending queue. */
export function MobileHeader({ dict, data }: MobileHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 md:hidden print:hidden">
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-display text-body-admin font-semibold">{data.bakeryName}</span>
        <span className="text-micro text-muted">{data.todayLabel}</span>
      </div>
      {data.pendingCount > 0 ? (
        <Link
          href="/admin/orders?status=PENDING"
          className="flex min-h-11 items-center rounded-chip px-2 text-small-admin font-semibold whitespace-nowrap text-o700 hover:bg-o50"
        >
          <span className="rounded-chip bg-o50 px-2">{fill(dict.shell.pending, { count: data.pendingCount })}</span>
        </Link>
      ) : null}
    </header>
  )
}
