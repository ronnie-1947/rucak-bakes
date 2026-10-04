import { ButtonLink } from "@/components/ui/ButtonLink"
import { Container } from "@/components/ui/Container"
import { Notice } from "@/components/ui/Notice"
import type { DaySheetData } from "@/lib/daysheet/queries"
import { tickKey } from "@/lib/daysheet/tick"
import { fill } from "@/lib/template"
import { BakeList } from "./BakeList"
import { pendingText } from "./copy"
import { CounterList } from "./CounterList"
import { DaySheetProvider } from "./DaySheetProvider"
import { NotesPanel } from "./NotesPanel"
import { PickupList } from "./PickupList"
import { PrintSheet } from "./PrintSheet"
import { SheetBar } from "./SheetBar"
import { SheetState } from "./SheetState"
import { SheetSummary } from "./SheetSummary"
import type { AdminCopy } from "./types"
import { ViewTabs } from "./ViewTabs"

type AdminDaySheetProps = {
  dict: AdminCopy
  data: DaySheetData
}

/**
 * /admin/daysheet (§10R) — one day as what to bake and who collects when. Bake, one column at every width: Notes and
 * allergies, then For orders (verified totals by category, then Made to order), then the day's counter-items. Pickups is
 * the other tab. Read standing: 32px quantities on phones, 40px from the tablet. Ticks persist for every device. Print
 * swaps the screen for an A4 layout (PrintSheet).
 */
export function AdminDaySheet({ dict, data }: AdminDaySheetProps) {
  const copy = dict.daysheet
  const showPending = data.params.pending
  const verifiedCount = data.verifiedCount
  // Orders, none verified, and no counter-items to bake meanwhile.
  const unverified = data.state === null && verifiedCount === 0 && !showPending && data.pendingCount > 0 && data.counter.length === 0

  const bake = data.bake
    .map((group) => ({ ...group, rows: group.rows.filter((row) => row.verified > 0 || (showPending && row.pending > 0)) }))
    .filter((group) => group.rows.length > 0)
  const made = data.made.filter((row) => showPending || !row.pending)
  const notes = data.notes.filter((note) => showPending || !note.pending)
  const orders = data.orders.filter((order) => showPending || !order.pending)

  const ticks: Record<string, boolean> = {}
  for (const row of data.bake.flatMap((group) => group.rows)) if (row.verified > 0) ticks[tickKey("item", row.menuItemId)] = row.baked
  for (const row of data.made) if (!row.pending) ticks[tickKey("line", row.lineId)] = row.baked
  for (const row of data.counter) ticks[tickKey("counter", row.tickId)] = row.baked
  for (const order of data.orders) if (!order.pending) ticks[tickKey("collect", order.id)] = order.collected

  return (
    <DaySheetProvider date={data.params.date} ticks={ticks} readOnly={data.isPast} dict={copy}>
      <div className="flex flex-col text-body print:hidden!">
        <SheetBar data={data} dict={copy} />

        <Container className="flex flex-col gap-4 pt-4 pb-12">
          {data.state ? (
            <SheetState data={data} dict={copy} />
          ) : (
            <>
              {data.isPast ? <Notice tone="quiet">{copy.past}</Notice> : null}
              {data.closed ? <Notice tone="warm">{copy.closedWithOrders}</Notice> : null}
              <SheetSummary data={data} dict={copy} />
              {unverified ? (
                <Notice tone="error" title={copy.unverifiedTitle}>
                  <span className="flex flex-col items-start gap-2">
                    <span>{fill(copy.unverifiedBody, { pending: pendingText(data.pendingCount, copy) })}</span>
                    <ButtonLink href={data.hrefs.pendingOrders} variant="outlineAccent">
                      {copy.verifyInOrders}
                    </ButtonLink>
                  </span>
                </Notice>
              ) : (
                <>
                  <ViewTabs view={data.params.view} hrefs={{ bake: data.hrefs.bake, pickups: data.hrefs.pickups }} pickupCount={verifiedCount} dict={copy} />
                  {data.params.view === "bake" ? (
                    <div className="flex flex-col gap-8">
                      <NotesPanel notes={notes} dict={copy} />
                      <BakeList groups={bake} made={made} showPending={showPending} pendingCount={data.pendingCount} dict={copy} />
                      <CounterList rows={data.counter} dict={copy} />
                    </div>
                  ) : (
                    <PickupList orders={orders} dict={copy} itemTemplate={dict.orders.items} />
                  )}
                </>
              )}
            </>
          )}
        </Container>
      </div>

      <PrintSheet data={data} dict={copy} itemTemplate={dict.orders.items} />
    </DaySheetProvider>
  )
}
