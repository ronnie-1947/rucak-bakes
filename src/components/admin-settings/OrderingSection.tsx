"use client"

import Link from "next/link"
import { saveOrderingRules } from "@/app/actions/settings"
import { Notice } from "@/components/ui/Notice"
import { withMaxOrders } from "@/lib/calendar/form"
import { formatPaise } from "@/lib/money"
import {
  DELIVERY_FEE,
  DELIVERY_RADIUS,
  MAX_ORDERS,
  ORDER_AHEAD,
  type OrderingValues,
  orderingChanges,
  orderingProblems,
  OVERBOOK_MAX,
} from "@/lib/settings/form"
import type { SettingsPageData } from "@/lib/settings/queries"
import { fill } from "@/lib/template"
import { AutoVerifySwitch } from "./AutoVerifySwitch"
import { errorText } from "./copy"
import { CutoffField } from "./CutoffField"
import { FormFrame } from "./FormFrame"
import { FulfilmentField } from "./FulfilmentField"
import { fullRow } from "./layout"
import { OrderPagePreview } from "./OrderPagePreview"
import { PaneGrid } from "./PaneGrid"
import { PauseZone } from "./PauseZone"
import { StepperField } from "./StepperField"
import type { SettingsCopy } from "./types"
import { useSectionForm } from "./useSectionForm"

type OrderingSectionProps = {
  data: SettingsPageData
  dict: SettingsCopy
}

const submit = (values: OrderingValues) => saveOrderingRules(values)

/**
 * The defaults new days start from (capacity, when ordering closes), how far ahead customers can order, and
 * how they get their order — saved together. Auto-verify and Pause ordering save the moment they're flipped.
 * From 1280px the customer's day picker previews beside them.
 */
export function OrderingSection({ data, dict }: OrderingSectionProps) {
  const d = dict.ordering
  const form = useSectionForm({ saved: data.ordering, problems: orderingProblems, changes: orderingChanges, submit, timezone: data.timezone })
  const { values, problems, set } = form
  const days = values.orderAheadDays

  return (
    <FormFrame form={form} canEdit={data.canEdit} dict={dict.save}>
      <PaneGrid
        canEdit={data.canEdit}
        where="orderPage"
        dict={dict.preview}
        preview={<OrderPagePreview values={values} today={data.today} dict={dict} />}
      >
        <Notice tone="warm" className={fullRow}>
          {d.defaultsNote}{" "}
          <Link href="/admin/calendar" className="font-semibold text-o700 hover:underline">
            {d.defaultsLink}
          </Link>
          .
        </Notice>
        <StepperField
          id="max-orders"
          label={d.maxOrders}
          hint={fill(d.maxHint, { max: values.maxOrders })}
          value={values.maxOrders}
          min={MAX_ORDERS.min}
          max={MAX_ORDERS.max}
          onChange={(maxOrders) => set(withMaxOrders(values, maxOrders))}
          decreaseLabel={d.fewer}
          increaseLabel={d.more}
          className={fullRow}
        />
        <StepperField
          id="overbook"
          label={d.overbook}
          hint={fill(d.overbookHint, { over: values.overbookLimit, max: values.maxOrders })}
          error={errorText(problems.overbookLimit, dict.errors, { max: values.maxOrders })}
          value={values.overbookLimit}
          min={values.maxOrders}
          max={OVERBOOK_MAX}
          onChange={(overbookLimit) => set({ overbookLimit })}
          decreaseLabel={d.acceptFewer}
          increaseLabel={d.acceptMore}
          className={fullRow}
        />
        <CutoffField time={values.cutoffTime} days={values.cutoffDays} onChange={set} dict={dict} />
        <StepperField
          id="order-ahead"
          label={d.ahead}
          hint={days === 1 ? d.aheadHintOne : fill(d.aheadHint, { count: days })}
          display={days === 1 ? d.aheadValueOne : fill(d.aheadValue, { count: days })}
          value={days}
          min={ORDER_AHEAD.min}
          max={ORDER_AHEAD.max}
          onChange={(orderAheadDays) => set({ orderAheadDays })}
          decreaseLabel={d.fewerDays}
          increaseLabel={d.moreDays}
          className={fullRow}
        />
        <AutoVerifySwitch on={data.autoVerifyTrusted} dict={dict} />
        <FulfilmentField
          pickup={values.pickup}
          delivery={values.delivery}
          onChange={set}
          error={errorText(problems.fulfilment, dict.errors)}
          dict={d}
        />
        {values.delivery ? (
          <>
            <StepperField
              id="delivery-radius"
              label={d.radius}
              hint={fill(d.radiusHint, { count: values.radiusKm })}
              display={fill(d.radiusValue, { count: values.radiusKm })}
              value={values.radiusKm}
              min={DELIVERY_RADIUS.min}
              max={DELIVERY_RADIUS.max}
              onChange={(radiusKm) => set({ radiusKm })}
              decreaseLabel={d.closer}
              increaseLabel={d.further}
              className="transition duration-250 ease-sheet starting:-translate-y-2 starting:opacity-0 motion-reduce:transition-none"
            />
            <StepperField
              id="delivery-fee"
              label={d.fee}
              hint={values.feeRupees === 0 ? d.feeFree : d.feeHint}
              display={formatPaise(values.feeRupees * 100)}
              value={values.feeRupees}
              min={DELIVERY_FEE.min}
              max={DELIVERY_FEE.max}
              step={DELIVERY_FEE.step}
              onChange={(feeRupees) => set({ feeRupees })}
              decreaseLabel={d.lowerFee}
              increaseLabel={d.higherFee}
              className="transition duration-250 ease-sheet starting:-translate-y-2 starting:opacity-0 motion-reduce:transition-none"
            />
          </>
        ) : null}
        <PauseZone pause={data.pause} dict={dict} />
      </PaneGrid>
    </FormFrame>
  )
}
