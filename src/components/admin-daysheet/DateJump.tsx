"use client"

import { useRouter } from "next/navigation"
import { isIsoDate } from "@/lib/dates"
import { type SheetParams, sheetHref } from "@/lib/daysheet/routes"

type DateJumpProps = {
  params: SheetParams
  today: string
  label: string
  className?: string
}

/** The platform's date picker — any day, keeping the tab and the pending switch. */
export function DateJump({ params, today, label, className }: DateJumpProps) {
  const router = useRouter()
  return (
    <label className={className}>
      <span className="sr-only">{label}</span>
      <input
        type="date"
        value={params.date}
        onChange={(event) => {
          const date = event.target.value
          if (isIsoDate(date)) router.push(sheetHref({ ...params, date }, today))
        }}
        className="h-11 rounded-field border border-border bg-background px-2 text-small-admin text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700"
      />
    </label>
  )
}
