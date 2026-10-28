"use client"

import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatClock } from "@/lib/calendar/cutoffs"
import type { ItemLive } from "@/lib/storefront/item"
import { DAY_PARAM, itemApi } from "@/lib/storefront/routes"
import { fill } from "@/lib/template"
import { type CutoffDefault, dateOptions, initialDate, type ItemCopy, type ItemIdentity, orderCopy, soonText } from "./availability"
import { CallBlock } from "./CallBlock"
import { CounterBlock } from "./CounterBlock"
import { DateLegend } from "./DateLegend"
import { OrderPanel } from "./OrderPanel"
import { OrderSkeleton } from "./OrderSkeleton"

type ItemOrderProps = {
  item: ItemIdentity
  /** Off → call only: the Call block at once, no dates to wait for. */
  orderable: boolean
  defaultCutoff: CutoffDefault
  /** E.164, or null. */
  phone: string | null
  /** "Call +91 98765 43210", or "" without a phone. */
  callLabel: string
  dict: ItemCopy
}

/** `gone` — taken off the menu since the page was prerendered. */
type Outcome = { kind: "ready"; live: ItemLive } | { kind: "gone" } | { kind: "failed" }

async function fetchLive(slug: string): Promise<Outcome> {
  const response = await fetch(itemApi(slug), { cache: "no-store" })
  if (response.status === 404) return { kind: "gone" }
  if (!response.ok) throw new Error(`GET ${itemApi(slug)} → ${response.status}`)
  return { kind: "ready", live: await response.json() }
}

/**
 * The part of the item page that moves with every order and the clock — "On the counter today", the pickup-date strip and
 * Add to cart, or the Call block. The rest of the page is prerendered; this fetches the booking window and today's counter
 * (GET /api/menu/[slug]) and shows OrderSkeleton until then. Keyed by slug, so a related item's link never shows the last
 * item's dates.
 */
export function ItemOrder({ item, orderable, defaultCutoff, phone, callLabel, dict }: ItemOrderProps) {
  const d = dict.itemPage
  const day = useSearchParams().get(DAY_PARAM) ?? undefined
  const [result, setResult] = useState<{ slug: string; outcome: Outcome } | null>(null)
  const slug = item.slug

  const load = useCallback(() => {
    let live = true
    fetchLive(slug).then(
      (outcome) => live && setResult({ slug, outcome }),
      () => live && setResult({ slug, outcome: { kind: "failed" } }),
    )
    return () => {
      live = false
    }
  }, [slug])

  useEffect(() => load(), [load])

  const outcome = result?.slug === slug ? result.outcome : null
  const callOnly = <CallBlock text={d.callOnly} phone={phone} callLabel={callLabel} />

  if (!outcome) return orderable ? <OrderSkeleton label={d.loading} /> : callOnly
  if (outcome.kind === "gone") return <CallBlock text={d.noDates} phone={phone} callLabel={callLabel} />
  if (outcome.kind === "failed") {
    if (!orderable) return callOnly
    return (
      <EmptyState
        message={d.loadFailed}
        action={
          <Button
            size="lg"
            className="font-semibold"
            onClick={() => {
              setResult(null)
              load()
            }}
          >
            {d.retry}
          </Button>
        }
      />
    )
  }

  const { window, counter } = outcome.live
  const options = orderable ? dateOptions(window, item, defaultCutoff, dict) : []
  const ordering = options.some((option) => option.look === "open")
  const counterText = !counter
    ? ""
    : counter.closes
      ? fill(phone ? d.counter.till : d.counter.tillNoPhone, { time: formatClock(counter.closes) })
      : phone
        ? d.counter.open
        : d.counter.openNoPhone

  return (
    <>
      {counter ? <CounterBlock text={counterText} phone={phone} callLabel={d.counterCall} callAria={callLabel} /> : null}
      {ordering ? (
        <OrderPanel
          options={options}
          initial={initialDate(options, day)}
          legend={<DateLegend soon={soonText(item.noticeDays, defaultCutoff, dict)} closed={d.dateStatus.closed} full={d.dateStatus.full} />}
          name={item.name}
          dict={orderCopy(dict)}
        />
      ) : orderable ? (
        <CallBlock text={d.noDates} phone={phone} callLabel={callLabel} />
      ) : (
        callOnly
      )}
    </>
  )
}
