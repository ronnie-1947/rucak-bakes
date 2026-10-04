import { Button } from "@/components/ui/Button"
import { CheckIcon } from "@/components/ui/icons/CheckIcon"
import { ItemThumb } from "@/components/ui/ItemThumb"
import { Tag } from "@/components/ui/Tag"
import { formatPaise } from "@/lib/money"
import type { NewOrderItem } from "@/lib/orders/new-order"
import { fill } from "@/lib/template"
import type { FormCopy } from "./types"

type MenuPickRowProps = {
  item: NewOrderItem
  added: boolean
  onAdd: () => void
  dict: FormCopy
}

/** A menu item in the picker: photo, name (+ "Call only" — exactly what phone orders are for), price, Add → ✓ Added. */
export function MenuPickRow({ item, added, onAdd, dict }: MenuPickRowProps) {
  const t = dict.newOrder.items
  return (
    <li className="grid min-h-15 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-border py-2">
      <ItemThumb images={item.images} muted={false} size="md" />
      <span className="flex min-w-0 flex-col">
        <span className="flex flex-wrap items-center gap-x-2">
          <span className="font-medium break-words">{item.name}</span>
          {item.orderable ? null : <Tag>{t.callOnly}</Tag>}
        </span>
        <span className="text-small-admin text-muted tabular-nums">
          {fill(t.perUnit, { price: formatPaise(item.pricePaise), unit: dict.priceUnits[item.unit] })}
        </span>
      </span>
      <Button
        variant={added ? "done" : "outlineLink"}
        size="sm"
        onClick={onAdd}
        aria-label={fill(added ? t.addedLabel : t.addLabel, { name: item.name })}
        className="min-w-19"
      >
        {added ? <CheckIcon className="size-4" /> : null}
        {added ? t.added : t.add}
      </Button>
    </li>
  )
}
