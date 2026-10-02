"use client"

import { Button } from "@/components/ui/Button"
import { useMenuActions } from "@/hooks/useMenuActions"
import { fill } from "@/lib/template"
import type { MenuCopy } from "./types"

type RestoreButtonProps = {
  id: string
  name: string
  dict: MenuCopy
}

/** Brings an archived item back, inactive. No confirm — the undo strip is the way back. */
export function RestoreButton({ id, name, dict }: RestoreButtonProps) {
  const { request, pending } = useMenuActions()
  return (
    <Button
      variant="outlineLink"
      aria-label={fill(dict.restoreName, { name })}
      disabled={pending}
      onClick={() => request("restore", [{ id, name, upcoming: [] }])}
    >
      {dict.restore}
    </Button>
  )
}
