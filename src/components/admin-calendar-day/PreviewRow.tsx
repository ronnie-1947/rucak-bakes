import { ItemThumb } from "@/components/ui/ItemThumb"
import { Tag } from "@/components/ui/Tag"
import { formatPaise } from "@/lib/money"

type PreviewRowProps = {
  name: string
  image: string | null
  pricePaise: number
  soldOut: boolean
  soldOutLabel: string
}

const fades: Record<"sold" | "on", string> = {
  sold: "opacity-60",
  on: "",
}

/** One counter-item in the customer preview: photo, name, the day's price, and Sold out (faded) when the counter ran out. */
export function PreviewRow({ name, image, pricePaise, soldOut, soldOutLabel }: PreviewRowProps) {
  return (
    <li className={`grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-2 border-t border-border py-2 ${fades[soldOut ? "sold" : "on"]}`}>
      <ItemThumb images={image ? [image] : []} muted={false} size="sm" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-small-admin font-medium">{name}</span>
        <span className="text-small-admin font-semibold text-o700 tabular-nums">{formatPaise(pricePaise)}</span>
      </span>
      {soldOut ? <Tag tone="red">{soldOutLabel}</Tag> : null}
    </li>
  )
}
