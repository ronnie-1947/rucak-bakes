"use client"

import { Switch } from "@/components/ui/Switch"
import { useMenuActions } from "@/hooks/useMenuActions"
import type { MenuItemRow } from "@/lib/menu/queries"
import { fill } from "@/lib/template"
import type { MenuCopy } from "./types"

type ItemSwitchProps = {
  item: MenuItemRow
  dict: MenuCopy
  className?: string
}

/** The inline Active switch. Turning off an item that's on upcoming days opens the confirm naming them. */
export function ItemSwitch({ item, dict, className }: ItemSwitchProps) {
  const { request, pending } = useMenuActions()
  return (
    <Switch
      checked={item.isActive}
      onChange={() => request(item.isActive ? "deactivate" : "activate", [{ id: item.id, name: item.name, upcoming: item.upcoming }])}
      stateLabel={item.isActive ? dict.active : dict.inactive}
      label={fill(dict.switchLabel, { name: item.name })}
      disabled={pending}
      className={className}
    />
  )
}
