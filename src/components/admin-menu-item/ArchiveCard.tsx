"use client"

import { Button } from "@/components/ui/Button"
import { type ItemTarget, useMenuActions } from "@/hooks/useMenuActions"
import type { ItemCopy } from "./types"

type ArchiveCardProps = {
  target: ItemTarget
  dict: ItemCopy["archiveCard"]
}

/** Detached 32px below the form, red heading. Opens the archive confirm naming the upcoming days — soft delete only. */
export function ArchiveCard({ target, dict }: ArchiveCardProps) {
  const { request, pending } = useMenuActions()
  return (
    <section aria-labelledby="archive-title" className="mt-8 flex flex-col gap-3 rounded-panel border border-border p-3">
      <h2 id="archive-title" className="text-h2 text-red">
        {dict.title}
      </h2>
      <p className="text-pretty">{dict.body}</p>
      <Button variant="dangerOutline" className="self-start" disabled={pending} onClick={() => request("archive", [target])}>
        {dict.button}
      </Button>
    </section>
  )
}
