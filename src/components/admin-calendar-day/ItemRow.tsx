import { Icon } from "@/components/ui/icons/Icon"
import { ItemThumb } from "@/components/ui/ItemThumb"
import { SelectBox } from "@/components/ui/SelectBox"
import { Tag } from "@/components/ui/Tag"
import type { EditorItem } from "@/lib/calendar/day"
import { type ItemPlan, overridePaise } from "@/lib/calendar/form"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import { ItemControls } from "./ItemControls"
import type { DayCopy } from "./types"

type ItemRowProps = {
  item: EditorItem
  plan: ItemPlan
  expanded: boolean
  onToggle: () => void
  onExpand: () => void
  onQuantity: (quantity: number) => void
  onOverride: (text: string) => void
  onSoldOut: () => void
  dict: DayCopy["items"]
}

const chevrons: Record<"open" | "shut", string> = {
  open: "rotate-180",
  shut: "",
}

const fades: Record<"included" | "left", string> = {
  included: "",
  left: "opacity-60",
}

/**
 * One menu item as a counter-item of the day: tick to bake it for the counter, its base price, "12 made" with any
 * override and Sold out; the chevron opens quantity made, price override and Sold out.
 */
export function ItemRow({ item, plan, expanded, onToggle, onExpand, onQuantity, onOverride, onSoldOut, dict }: ItemRowProps) {
  const override = plan.included ? overridePaise(plan.override, item.basePricePaise) : null
  const fade = plan.included ? "included" : "left"

  return (
    <li className="rounded-panel border border-border bg-background">
      <div className="grid min-h-14 grid-cols-[2.75rem_3rem_minmax(0,1fr)_2.75rem] items-center gap-2 py-1 pr-1">
        <span className="grid place-items-center">
          <SelectBox checked={plan.included} onChange={onToggle} label={fill(dict.include, { name: item.name })} />
        </span>
        <span className={fades[fade]}>
          <ItemThumb images={item.image ? [item.image] : []} muted={item.state !== "active"} size="md" />
        </span>
        <span className={`flex min-w-0 flex-col ${fades[fade]}`}>
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{item.name}</span>
            {item.state === "active" ? null : <Tag tone="quiet">{item.state === "inactive" ? dict.inactive : dict.archived}</Tag>}
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-small-admin text-muted tabular-nums">
            <span>{formatPaise(item.basePricePaise)}</span>
            {plan.included ? <span>{fill(dict.made, { count: plan.quantity })}</span> : null}
            {typeof override === "number" ? <Tag tone="accent">{fill(dict.overrideChip, { price: formatPaise(override) })}</Tag> : null}
            {plan.included && plan.soldOut ? <Tag tone="red">{dict.soldOutChip}</Tag> : null}
          </span>
        </span>
        {plan.included ? (
          <button
            type="button"
            onClick={onExpand}
            aria-expanded={expanded}
            aria-label={fill(expanded ? dict.collapse : dict.expand, { name: item.name })}
            className="grid size-11 place-items-center rounded-button text-muted hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
          >
            <Icon
              name="chevronDown"
              className={`size-4.5 transition-transform duration-250 ease-sheet motion-reduce:transition-none ${chevrons[expanded ? "open" : "shut"]}`}
            />
          </button>
        ) : null}
      </div>
      {plan.included && expanded ? (
        <ItemControls item={item} plan={plan} onQuantity={onQuantity} onOverride={onOverride} onSoldOut={onSoldOut} dict={dict} />
      ) : null}
    </li>
  )
}
