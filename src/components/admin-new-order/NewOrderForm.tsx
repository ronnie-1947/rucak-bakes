"use client"

import { Container } from "@/components/ui/Container"
import type { NewOrderPage } from "@/lib/orders/new-order"
import { ClosedDayAlert } from "./ClosedDayAlert"
import { CustomerSection } from "./CustomerSection"
import { FullDayDialog } from "./FullDayDialog"
import { ItemsSection } from "./ItemsSection"
import { LeaveDialog } from "./LeaveDialog"
import { NotesSection } from "./NotesSection"
import { PageHeader } from "./PageHeader"
import { SummaryBar } from "./SummaryBar"
import { SummaryCard } from "./SummaryCard"
import { SummarySheet } from "./SummarySheet"
import { TopBar } from "./TopBar"
import type { FormCopy } from "./types"
import { useNewOrder } from "./useNewOrder"
import { WhenSection } from "./WhenSection"

type NewOrderFormProps = {
  page: NewOrderPage
  dict: FormCopy
}

/**
 * /admin/orders/new — one column in the order the conversation goes: Customer → Items → When → Notes. Phones get a
 * sticky top bar and a summary bar above the tab bar (its sheet holds the details); from 768px the summary is a card after
 * the form, capped at 640px; from 1280px it sits sticky beside it (62 / 38); from 1600px the columns are 640px and 400px.
 */
export function NewOrderForm({ page, dict }: NewOrderFormProps) {
  const form = useNewOrder(page)
  const d = dict.newOrder

  return (
    <div className="flex min-h-full flex-col">
      <TopBar onBack={form.back} dict={d} />
      <Container className="flex flex-1 flex-col gap-4 pt-4 pb-12 md:gap-6 md:pt-6 lg:pt-8">
        <PageHeader onBack={form.back} dict={d} />
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] xl:gap-8 2xl:grid-cols-[minmax(0,40rem)_minmax(0,25rem)]">
          <div className="flex w-full max-w-160 min-w-0 flex-col gap-4 xl:max-w-none">
            {form.day && !form.day.isOpen ? <ClosedDayAlert date={form.day.date} dict={d} /> : null}
            <CustomerSection form={form} dict={dict} />
            <ItemsSection form={form} dict={dict} />
            <WhenSection form={form} dict={dict} />
            <NotesSection form={form} dict={d.notes} />
          </div>
          <SummaryCard form={form} dict={dict} />
        </div>
      </Container>
      <SummaryBar form={form} dict={d} />
      <SummarySheet form={form} dict={dict} />
      <FullDayDialog form={form} dict={d} />
      <LeaveDialog form={form} dict={d.leave} />
    </div>
  )
}
