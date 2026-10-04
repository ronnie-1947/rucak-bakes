import { Tag } from "@/components/ui/Tag"

type ItemPriceProps = {
  /** "₹240", or "from ₹1,500" for a call-only item. */
  price: string
  /** "per box", or "" for items sold each. */
  unit: string
  /** "Needs 1 day’s notice" / "Same day"; null for a call-only item. */
  notice: string | null
}

/** The price row under the name: the price, its unit, and the notice it needs. */
export function ItemPrice({ price, unit, notice }: ItemPriceProps) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-h1 font-semibold text-o700 tabular-nums">{price}</span>
      {unit ? <span className="text-small text-muted">{unit}</span> : null}
      {notice ? (
        <Tag tone="warm" size="md" className="font-semibold">
          {notice}
        </Tag>
      ) : null}
    </p>
  )
}
