import { buttonClasses } from "@/components/ui/Button"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { Icon } from "@/components/ui/icons/Icon"
import type { IsoDate } from "@/lib/dates"
import { formatPaise } from "@/lib/money"
import type { PlacedSummary } from "@/lib/orders/checkout"
import { formatForDisplay } from "@/lib/phone"
import type { CartPageData } from "@/lib/storefront/cart"
import { fill } from "@/lib/template"
import { ActionBar } from "./ActionBar"
import { ConfirmedRow } from "./ConfirmedRow"
import { type CartPageCopy, dayTitle, pickupHours } from "./copy"
import { NextStep } from "./NextStep"

type ConfirmedProps = {
  order: PlacedSummary
  today: IsoDate
  pickup: CartPageData["pickup"]
  /** The bakery's E.164 number, or null — Call the bakery is left out without one. */
  phone: string | null
  copy: CartPageCopy
}

/**
 * State 3 — the order went in. The code large (read aloud on the phone, written on the bag), the customer's own
 * number back so they can spot a typo, what was ordered as the server priced it, and what happens next.
 */
export function Confirmed({ order, today, pickup, phone, copy }: ConfirmedProps) {
  const d = copy.cart.done
  const [before, after] = d.callBack.split("{phone}")
  const hours = order.type === "PICKUP" ? pickupHours(pickup.hours, order.date, copy) : null
  const place = order.type === "PICKUP" ? pickup.address.join(", ") : order.address
  const actions = (
    <>
      <ButtonLink href="/" variant="outlineLink" size="lg" className="min-w-0 flex-1">
        {d.backToMenu}
      </ButtonLink>
      {phone ? (
        <a href={`tel:${phone}`} className={buttonClasses("primary", "lg", "min-w-0 flex-1 font-semibold")}>
          {d.callBakery}
        </a>
      ) : null}
    </>
  )

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 md:gap-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="grid size-10 place-items-center rounded-pill bg-green-soft text-green">
          <Icon name="check" className="size-5.5" strokeWidth={2.4} />
        </span>
        <span className="text-small text-muted">{d.number}</span>
        <span className="font-display text-glance font-semibold tabular-nums">{order.code}</span>
        <p className="text-balance">
          {before}
          <strong className="font-semibold whitespace-nowrap tabular-nums">{formatForDisplay(order.phone)}</strong>
          {after}
        </p>
      </div>

      <dl className="flex flex-col divide-y divide-border rounded-card border border-border px-4">
        <ConfirmedRow label={d.day}>{dayTitle(order.date, today, copy)}</ConfirmedRow>
        {hours ? <ConfirmedRow label={d.time}>{hours}</ConfirmedRow> : null}
        {place ? <ConfirmedRow label={d[order.type]}>{place}</ConfirmedRow> : null}
        {order.items.map((item, index) => (
          <ConfirmedRow key={index} label={<span className="text-foreground">{fill(d.line, { qty: item.quantity, name: item.name })}</span>}>
            <span className="tabular-nums">{formatPaise(item.lineTotalPaise)}</span>
          </ConfirmedRow>
        ))}
        {order.deliveryFeePaise > 0 ? (
          <ConfirmedRow label={copy.cart.deliveryFee}>
            <span className="tabular-nums">{formatPaise(order.deliveryFeePaise)}</span>
          </ConfirmedRow>
        ) : null}
        <ConfirmedRow label={d.total[order.type]} strong>
          {formatPaise(order.totalPaise)}
        </ConfirmedRow>
        {order.note ? <ConfirmedRow label={d.note}>{order.note}</ConfirmedRow> : null}
      </dl>

      <section aria-labelledby="cart-next" className="flex flex-col gap-4">
        <h2 id="cart-next" className="text-h2">
          {d.next}
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          <NextStep icon="phone" title={d.confirm.title} body={d.confirm.body} />
          <NextStep icon="flame" title={d.bake.title} body={d.bake.body} />
          <NextStep icon="bag" title={d.collect[order.type].title} body={d.collect[order.type].body} />
        </ol>
      </section>

      <div className="flex flex-col gap-3">
        <div className="hidden gap-3 lg:flex">{actions}</div>
        <p className="text-center text-small text-muted">{d.screenshot}</p>
      </div>
      <ActionBar>{actions}</ActionBar>
    </div>
  )
}
