"use client"

import Link from "next/link"
import { SelectBox } from "@/components/ui/SelectBox"
import { Tag } from "@/components/ui/Tag"
import { priceText } from "@/lib/menu/copy"
import type { MenuItemRow } from "@/lib/menu/queries"
import { fill } from "@/lib/template"
import { usageText } from "./copy"
import { ItemMenu } from "./ItemMenu"
import { ItemSwitch } from "./ItemSwitch"
import { ItemThumb } from "./ItemThumb"
import type { AdminCopy } from "./types"

type MenuRowProps = {
  item: MenuItemRow
  dict: AdminCopy
  selectMode: boolean
  checked: boolean
  onToggle: () => void
}

const backgrounds: Record<"checked" | "plain", string> = {
  checked: "bg-o50",
  plain: "bg-background",
}

const dims: Record<"full" | "dim", string> = {
  full: "",
  dim: "opacity-55",
}

/**
 * One item in the list view below 1024px: photo, name and category, price, this week's usage, and the
 * ⋯ menu over the Active switch. The row opens the item; in select mode it toggles the tick instead.
 */
export function MenuRow({ item, dict, selectMode, checked, onToggle }: MenuRowProps) {
  const d = dict.menu

  return (
    <article className={`relative flex min-h-18 items-start gap-3 border-b border-border py-2 ${backgrounds[checked ? "checked" : "plain"]}`}>
      {selectMode ? (
        <span className="flex h-14 items-center">
          <SelectBox checked={checked} onChange={onToggle} label={fill(d.selectItem, { name: item.name })} cover />
        </span>
      ) : (
        <Link href={`/admin/menu/${item.id}`} aria-label={fill(d.open, { name: item.name })} className="absolute inset-0" />
      )}

      <ItemThumb images={item.images} muted={!item.isActive} />

      <div className={`flex min-w-0 flex-1 flex-col ${dims[item.isActive ? "full" : "dim"]}`}>
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium">{item.name}</span>
          {item.categoryName ? <span className="text-small-admin text-muted">{item.categoryName}</span> : null}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small-admin tabular-nums">
          <span className="font-semibold text-o700">{priceText(item, d, dict.priceUnits)}</span>
          {item.images.length === 0 ? <Tag tone="warm">{d.noPhoto}</Tag> : null}
        </span>
        <span className="text-small-admin text-pretty text-muted tabular-nums">{usageText(item, d)}</span>
        {item.isActive ? null : <span className="text-small-admin text-muted">{d.inactiveNote}</span>}
      </div>

      <div className="relative z-20 flex shrink-0 flex-col items-end">
        <ItemMenu item={item} dict={d} />
        <ItemSwitch item={item} dict={d} className="min-w-26" />
      </div>
    </article>
  )
}
