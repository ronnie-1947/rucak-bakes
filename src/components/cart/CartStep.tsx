import type { ReactNode } from "react"
import { Button } from "@/components/ui/Button"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { Icon } from "@/components/ui/icons/Icon"
import type { Cart, CartLine } from "@/lib/cart/cart"
import { ActionBar } from "./ActionBar"
import { CartLineRow, type CartLineRowProps } from "./CartLineRow"
import type { CartPageCopy } from "./copy"
import { NoteField } from "./NoteField"
import { StepLayout } from "./StepLayout"

type CartStepProps = {
  cart: Cart
  /** What a line shows besides itself: what changed, its notice, the too-soon flag. */
  lineInfo: (line: CartLine) => Pick<CartLineRowProps, "note" | "notice" | "flag">
  onLine: (line: CartLine, qty: number) => void
  /** Above the lines: the clear question, what the live check took out, why the day can't take the order. */
  alerts: ReactNode
  dayCard: ReactNode
  summary: ReactNode
  note: string
  onNote: (note: string) => void
  /** Null when Continue can go; "" when it can't and an alert above says why. */
  blocked: string | null
  onContinue: () => void
  /** For the phone bar — "₹660". */
  subtotal: string
  copy: CartPageCopy
}

/** State 1 — the cart: day, lines, Add more items, the note, the money; Continue in the bar or the side card. */
export function CartStep({
  cart,
  lineInfo,
  onLine,
  alerts,
  dayCard,
  summary,
  note,
  onNote,
  blocked,
  onContinue,
  subtotal,
  copy,
}: CartStepProps) {
  const c = copy.cart
  const blockedLine = blocked ? <p className="text-small text-pretty text-red">{blocked}</p> : null
  const proceed = (
    <Button size="lg" disabled={blocked !== null} onClick={onContinue} className="w-full font-semibold">
      {c.continue}
    </Button>
  )

  return (
    <>
      <StepLayout
        main={
          <>
            {alerts}
            <div className="lg:hidden">{dayCard}</div>
            <ul className="divide-y divide-border border-y border-border">
              {cart.items.map((line) => (
                <CartLineRow
                  key={line.menuItemId}
                  line={line}
                  date={cart.fulfilmentDate}
                  {...lineInfo(line)}
                  onQuantity={(qty) => onLine(line, qty)}
                  copy={copy}
                />
              ))}
            </ul>
            <ButtonLink href="/" variant="outlineLink" size="lg" className="w-full">
              <Icon name="plus" className="size-4.5" strokeWidth={2.2} />
              {c.addMore}
            </ButtonLink>
            <NoteField value={note} onChange={onNote} label={c.note} placeholder={c.notePlaceholder} />
            <div className="border-t border-border pt-4 lg:hidden">{summary}</div>
            <div className="lg:hidden">{blockedLine}</div>
          </>
        }
        side={
          <>
            {dayCard}
            {summary}
            {blockedLine}
            {proceed}
          </>
        }
      />
      <ActionBar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-micro text-muted uppercase">{c.subtotal}</span>
          <span className="text-h2 font-semibold text-o700 tabular-nums">{subtotal}</span>
        </div>
        <Button size="lg" disabled={blocked !== null} onClick={onContinue} className="min-w-40 font-semibold">
          {c.continue}
        </Button>
      </ActionBar>
    </>
  )
}
