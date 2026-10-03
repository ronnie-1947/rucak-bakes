import { ButtonLink } from "@/components/ui/ButtonLink"
import { Container } from "@/components/ui/Container"
import { Notice } from "@/components/ui/Notice"
import type { DaySheetData } from "@/lib/daysheet/queries"
import { tickKey } from "@/lib/daysheet/tick"
import { fill } from "@/lib/template"
import { BakeList } from "./BakeList"
import { pendingText } from "./copy"
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
 * /admin/daysheet — one day's orders as what to bake (verified totals, by category) and who collects when.
 * Read standing: 32px quantities on phones, 40px from the tablet. Bake and Pickups are tabs; from 1280px the
 * notes sit beside the bake list instead of above it. Ticks persist for every device. Print swaps the screen
 * for an A4 layout (PrintSheet).
 */
export function AdminDaySheet({ dict, data }: AdminDaySheetProps) {
  const copy = dict.daysheet
  const showPending = data.params.pending
  const verifiedCount = data.verifiedCount
  const unverified = data.state === null && verifiedCount === 0 && !showPending

  const bake = data.bake
    .map((group) => ({ ...group, rows: group.rows.filter((row) => row.verified > 0 || (showPending && row.pending > 0)) }))
    .filter((group) => group.rows.length > 0)
  const notes = data.notes.filter((note) => showPending || !note.pending)
  const orders = data.orders.filter((order) => showPending || !order.pending)

  const ticks: Record<string, boolean> = {}
  for (const row of data.bake.flatMap((group) => group.rows)) if (row.tickId) ticks[tickKey("bake", row.tickId)] = row.baked
  for (const order of data.orders) if (!order.pending) ticks[tickKey("collect", order.id)] = order.collected

  return (
    <DaySheetProvider ticks={ticks} readOnly={data.isPast} dict={copy}>
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
                    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                      <NotesPanel notes={notes} dict={copy} className="xl:order-2" />
                      <BakeList groups={bake} showPending={showPending} dict={copy} className="xl:order-1" />
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
