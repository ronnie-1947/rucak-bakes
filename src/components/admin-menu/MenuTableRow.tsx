"use client"

import Link from "next/link"
import { SelectBox } from "@/components/ui/SelectBox"
import { Tag } from "@/components/ui/Tag"
import { priceText } from "@/lib/menu/copy"
import type { MenuItemRow } from "@/lib/menu/queries"
import { fill } from "@/lib/template"
import { noticeText, usageText } from "./copy"
import { ItemMenu } from "./ItemMenu"
import { ItemSwitch } from "./ItemSwitch"
import { ItemThumb } from "@/components/ui/ItemThumb"
import type { AdminCopy } from "./types"

type MenuTableRowProps = {
  item: MenuItemRow
  dict: AdminCopy
  selectMode: boolean
  checked: boolean
  onToggle: () => void
}

const backgrounds: Record<"checked" | "plain", string> = {
  checked: "bg-o50",
  plain: "hover:bg-sunken",
}

const dims: Record<"full" | "dim", string> = {
  full: "",
  dim: "opacity-55",
}

export function MenuTableRow({ item, dict, selectMode, checked, onToggle }: MenuTableRowProps) {
  const d = dict.menu
  const dim = dims[item.isActive ? "full" : "dim"]
  const cell = "border-b border-border py-2 group-last:border-b-0"

  return (
    <tr className={`group ${backgrounds[checked ? "checked" : "plain"]}`}>
      {selectMode ? (
        <td className={`${cell} pl-3`}>
          <SelectBox checked={checked} onChange={onToggle} label={fill(d.selectItem, { name: item.name })} />
        </td>
      ) : null}
      <td className={`${cell} pl-3`}>
        <ItemThumb images={item.images} muted={!item.isActive} />
      </td>
      <td className={`${cell} px-2 ${dim}`}>
        <span className="flex flex-col items-start">
          <Link href={`/admin/menu/${item.id}`} className="font-medium hover:underline">
            {item.name}
          </Link>
          {item.orderable ? null : <Tag tone="neutral">{d.callOnly}</Tag>}
          {item.images.length === 0 ? <Tag tone="warm">{d.noPhoto}</Tag> : null}
          {item.isActive ? null : <span className="text-small-admin text-muted">{d.inactiveNote}</span>}
        </span>
      </td>
      <td className={`${cell} px-2 text-small-admin text-muted ${dim}`}>{item.categoryName ?? "—"}</td>
      <td className={`${cell} px-2 text-small-admin ${dim}`}>{noticeText(item, d)}</td>
      <td className={`${cell} px-2 text-right font-semibold text-o700 ${dim}`}>{priceText(item, d, dict.priceUnits)}</td>
      <td className={`${cell} px-2 text-small-admin text-muted ${dim}`}>{usageText(item, d)}</td>
      <td className={`${cell} px-2`}>
        <ItemSwitch item={item} dict={d} />
      </td>
      <td className={`${cell} pr-3`}>
        <ItemMenu item={item} dict={d} />
      </td>
    </tr>
  )
}
