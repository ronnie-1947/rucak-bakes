import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { ItemThumb } from "@/components/ui/ItemThumb"
import { Stepper } from "@/components/ui/Stepper"
import { Tag, type TagTone } from "@/components/ui/Tag"
import type { CartLine } from "@/lib/cart/cart"
import type { LineNote } from "@/lib/cart/check"
import type { IsoDate } from "@/lib/dates"
import { formatPaise } from "@/lib/money"
import { itemHref } from "@/lib/storefront/routes"
import { fill } from "@/lib/template"
import type { CartPageCopy } from "./copy"

type CartLineRowProps = {
  line: CartLine
  date: IsoDate
  /** What the live menu changed — a tag beside the price. */
  note: LineNote | undefined
  /** What the day has left — the stepper's ceiling. */
  max: number
  onQuantity: (qty: number) => void
  copy: CartPageCopy
}

const noteTones: Record<LineNote, TagTone> = {
  price: "warm",
  fewer: "warm",
  soldOut: "red",
}

/**
 * One cart line: photo and name (both open the item on the cart's day), price each with what changed, Remove,
 * then the stepper over the line total. Under 480px the stepper row drops below the name so neither squeezes.
 */
export function CartLineRow({ line, date, note, max, onQuantity, copy }: CartLineRowProps) {
  const c = copy.cart
  const href = itemHref(line.slug, date)
  const noteText = note ? (note === "fewer" ? fill(c.notes.fewer, { count: max }) : c.notes[note]) : null
  return (
    <li className="flex gap-3 py-3">
      <Link href={href} tabIndex={-1} aria-hidden className="shrink-0 self-start">
        <ItemThumb images={line.imageId ? [line.imageId] : []} muted={note === "soldOut"} />
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
            <span>{fill(c.each, { price: formatPaise(line.priceSnapshot) })}</span>
            {note && noteText ? <Tag tone={noteTones[note]}>{noteText}</Tag> : null}
          </span>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => onQuantity(0)}
            aria-label={fill(c.removeLabel, { name: line.name })}
            className="-ml-3 self-start"
          >
            <Icon name="close" className="size-3.5" strokeWidth={2.4} />
            {c.remove}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3 xs:flex-col xs:items-end xs:gap-1">
          <div>
            <Stepper
              value={line.qty}
              min={1}
              max={Math.max(max, line.qty)}
              onChange={onQuantity}
              decreaseLabel={fill(copy.item.decrease, { name: line.name })}
              increaseLabel={fill(copy.item.increase, { name: line.name })}
            />
          </div>
          <span className="font-semibold tabular-nums">{formatPaise(line.priceSnapshot * line.qty)}</span>
        </div>
      </div>
    </li>
  )
}
