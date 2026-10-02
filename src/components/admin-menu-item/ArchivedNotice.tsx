"use client"

import { Button } from "@/components/ui/Button"
import { useMenuActions } from "@/hooks/useMenuActions"
import { fill } from "@/lib/template"
import type { ItemCopy } from "./types"

type ArchivedNoticeProps = {
  id: string
  name: string
  archivedLabel: string
  dict: ItemCopy
}

/** On an archived item's page: when it was archived, what that means, and Restore (back inactive). */
export function ArchivedNotice({ id, name, archivedLabel, dict }: ArchivedNoticeProps) {
  const { request, pending } = useMenuActions()
  return (
    <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-panel bg-o50 py-1 pr-1 pl-3">
      <span className="min-w-0 flex-1 text-small-admin text-pretty">{fill(dict.archivedNotice, { date: archivedLabel })}</span>
      <Button variant="link" size="sm" disabled={pending} onClick={() => request("restore", [{ id, name, upcoming: [] }])}>
        {dict.restore}
      </Button>
    </div>
  )
}
