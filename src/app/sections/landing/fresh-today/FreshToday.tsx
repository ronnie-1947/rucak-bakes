import { ItemCard } from "@/components/item-card/ItemCard"
import { CallLink } from "@/components/ui/CallLink"
import { Tag } from "@/components/ui/Tag"
import type { IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import { formatForDisplay } from "@/lib/phone"
import type { FreshToday as FreshTodayData } from "@/lib/storefront/types"
import { fill } from "@/lib/template"
import { freshLine, freshMessage, freshPill } from "./copy"

type FreshTodayProps = {
  fresh: FreshTodayData
  today: IsoDate
  /** E.164, or null — no Call button without one. */
  phone: string | null
  dict: Dict["landing"]["freshToday"]
  store: Dict["store"]
}

/**
 * "Fresh today" (§10R) — today's counter-items only: baked for the counter, walked in for, never ordered online. A status
 * pill; then the walk-in line with one Call button and the cards (each opens its item page; a sold-out one is faded with a
 * red chip) — or, with nothing on the counter, why: orders only today, or closed and when it's back.
 */
export function FreshToday({ fresh, today, phone, dict, store }: FreshTodayProps) {
  const pill = freshPill(fresh, dict)
  const counter = fresh.state === "on" || fresh.state === "soldOut"
  return (
    <section aria-labelledby="fresh-today" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id="fresh-today" className="text-h2">
          {dict.title}
        </h2>
        <Tag tone={pill.tone} size="pill">
          {pill.text}
        </Tag>
      </div>
      {counter ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-pretty">{freshLine(fresh, Boolean(phone), dict)}</p>
            {phone ? <CallLink phone={phone} label={fill(dict.call, { phone: formatForDisplay(phone) })} /> : null}
          </div>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {fresh.items.map((item) => (
              <li key={item.id} className="flex min-w-0">
                <ItemCard
                  item={item}
                  chip={item.soldOut ? { text: store.item.soldOut, tone: "red" } : null}
                  muted={item.soldOut}
                  dict={store.item}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="rounded-card bg-sunken px-4 py-6 font-medium text-pretty">{freshMessage(fresh, today, dict, store.days)}</p>
      )}
    </section>
  )
}
