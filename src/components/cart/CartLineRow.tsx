import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { ItemThumb } from "@/components/ui/ItemThumb"
import { Stepper } from "@/components/ui/Stepper"
import { Tag } from "@/components/ui/Tag"
import { type CartLine, MAX_LINE_QTY } from "@/lib/cart/cart"
import type { LineNote } from "@/lib/cart/check"
import type { IsoDate } from "@/lib/dates"
import { formatWeight } from "@/lib/menu/sizes"
import { formatPaise } from "@/lib/money"
import { itemHref } from "@/lib/storefront/routes"
import { fill } from "@/lib/template"
import type { CartPageCopy } from "./copy"
import { TooSoonFlag } from "./TooSoonFlag"

export type CartLineRowProps = {
  line: CartLine
  date: IsoDate
  /** What changed since it was added — a tag beside the price. */
  note: LineNote | undefined
  /** "Order 2 days ahead" — the item's notice, beside its price. Null until the live check has said. */
  notice: string | null
  /** When its notice makes the cart's day too soon. */
  flag: { text: string; moveLabel: string; onMove: () => void } | null
  onQuantity: (qty: number) => void
  copy: CartPageCopy
}

/**
 * One cart line: photo and name (both open the item on the cart's day), its size when picked by weight ("1.5 kg"), price each
 * and notice, Remove, then the stepper over
 * the line total; under it the too-soon flag when the date doesn't give it enough notice. Under 480px the stepper row drops
 * below the name so neither squeezes.
 */
export function CartLineRow({ line, date, note, notice, flag, onQuantity, copy }: CartLineRowProps) {
  const c = copy.cart
  const href = itemHref(line.slug, date)
  const removeAria = fill(c.removeLabel, { name: line.name })
  const size = line.grams ? formatWeight(line.grams) : null
  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex gap-3">
        <Link href={href} tabIndex={-1} aria-hidden className="shrink-0 self-start">
          <ItemThumb images={line.imageId ? [line.imageId] : []} muted={false} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-2 xs:flex-row xs:items-center xs:gap-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <Link
              href={href}
              className="self-start rounded-chip font-medium text-pretty hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700"
            >
              {line.name}
            </Link>
            <span className="flex flex-wrap items-center gap-2 text-small text-muted tabular-nums">
              <span>{[size, fill(c.each, { price: formatPaise(line.priceSnapshot) }), notice].filter(Boolean).join(" · ")}</span>
              {note ? <Tag tone="warm">{c.notes[note]}</Tag> : null}
            </span>
            <Button variant="quiet" size="sm" onClick={() => onQuantity(0)} aria-label={removeAria} className="-ml-3 self-start">
              <Icon name="close" className="size-3.5" strokeWidth={2.4} />
              {c.remove}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3 xs:flex-col xs:items-end xs:gap-1">
            <div>
              <Stepper
                value={line.qty}
                min={1}
                max={MAX_LINE_QTY}
                onChange={onQuantity}
                decreaseLabel={fill(copy.item.decrease, { name: line.name })}
                increaseLabel={fill(copy.item.increase, { name: line.name })}
              />
            </div>
            <span className="font-semibold tabular-nums">{formatPaise(line.priceSnapshot * line.qty)}</span>
          </div>
        </div>
      </div>
      {flag ? (
        <TooSoonFlag
          text={flag.text}
          removeLabel={c.remove}
          removeAria={removeAria}
          onRemove={() => onQuantity(0)}
          moveLabel={flag.moveLabel}
          onMove={flag.onMove}
        />
      ) : null}
    </li>
  )
}
