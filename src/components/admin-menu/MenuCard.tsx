"use client"

import Link from "next/link"
import { SelectBox } from "@/components/ui/SelectBox"
import { priceText } from "@/lib/menu/copy"
import type { MenuItemRow } from "@/lib/menu/queries"
import { fill } from "@/lib/template"
import { usageText } from "./copy"
import { ItemCover } from "./ItemCover"
import { ItemMenu } from "./ItemMenu"
import { ItemSwitch } from "./ItemSwitch"
import type { AdminCopy } from "./types"

type MenuCardProps = {
  item: MenuItemRow
  dict: AdminCopy
  selectMode: boolean
  checked: boolean
  onToggle: () => void
}

const frames: Record<"checked" | "plain", string> = {
  checked: "border-o700",
  plain: "border-border hover:border-border-strong",
}

const dims: Record<"full" | "dim", string> = {
  full: "",
  dim: "opacity-55",
}

/**
 * One item in the grid: 4:3 cover, name, category, price, usage, and a footer with the Active switch
 * and the ⋯ menu (which opens upward). The card opens the item; in select mode it toggles the tick.
 */
export function MenuCard({ item, dict, selectMode, checked, onToggle }: MenuCardProps) {
  const d = dict.menu

  return (
    <article className={`relative flex min-w-0 flex-col gap-2 rounded-panel border bg-background p-3 ${frames[checked ? "checked" : "plain"]}`}>
      {selectMode ? null : (
        <Link href={`/admin/menu/${item.id}`} aria-label={fill(d.open, { name: item.name })} className="absolute inset-0 rounded-panel" />
      )}

      <div className={`flex flex-col gap-3 ${dims[item.isActive ? "full" : "dim"]}`}>
        <ItemCover images={item.images} isActive={item.isActive} dict={d} />
        <div className="flex min-w-0 items-start gap-2">
          {selectMode ? <SelectBox checked={checked} onChange={onToggle} label={fill(d.selectItem, { name: item.name })} cover /> : null}
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">{item.name}</span>
            {item.categoryName ? <span className="text-small-admin text-muted">{item.categoryName}</span> : null}
            <span className="font-semibold text-o700 tabular-nums">{priceText(item, d, dict.priceUnits)}</span>
          </div>
        </div>
        <span className="text-small-admin text-pretty text-muted tabular-nums">{usageText(item, d)}</span>
        {item.isActive ? null : <span className="text-small-admin text-muted">{d.inactiveNote}</span>}
      </div>

      <div className="relative z-20 mt-auto flex flex-wrap items-center justify-between gap-x-2 border-t border-border pt-1">
        <ItemSwitch item={item} dict={d} />
        <ItemMenu item={item} dict={d} direction="up" />
      </div>
    </article>
  )
}
