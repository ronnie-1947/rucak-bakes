"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react"
import { checkCart, createOrder } from "@/app/actions/checkout"
import { Button } from "@/components/ui/Button"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { EmptyState } from "@/components/ui/EmptyState"
import { Notice } from "@/components/ui/Notice"
import { Spinner } from "@/components/ui/Spinner"
import { useCart } from "@/hooks/useCart"
import { usePageBack } from "@/hooks/usePageTitle"
import { type CartLine, MAX_LINE_QTY } from "@/lib/cart/cart"
import { type CartCheck, type LineNote, reconcile } from "@/lib/cart/check"
import { readCustomer, saveCustomer } from "@/lib/cart/customer"
import { getCart } from "@/lib/cart/store"
import type { IsoDate } from "@/lib/dates"
import { formatPaise } from "@/lib/money"
import { type CheckoutRefusal, type DetailsField, type DetailsValues, detailsProblems, type PlacedSummary } from "@/lib/orders/checkout"
import type { CartPageData } from "@/lib/storefront/cart"
import type { DayStatus } from "@/lib/storefront/types"
import { fill } from "@/lib/template"
import { CartHeading } from "./CartHeading"
import { CartStep } from "./CartStep"
import { CartSummary } from "./CartSummary"
import { ClearConfirm } from "./ClearConfirm"
import { Confirmed } from "./Confirmed"
import { type CartPageCopy, dayMeta, dayName, dayProblem, dayTitle, type Fulfilment, itemsText, pickupHours } from "./copy"
import { DayCard } from "./DayCard"
import { DaySheet } from "./DaySheet"
import { DetailsForm, FIELD_IDS } from "./DetailsForm"
import { DetailsStep } from "./DetailsStep"
import { Expectation } from "./Expectation"
import { OrderProblem, type Problem } from "./OrderProblem"
import { PlaceButton } from "./PlaceButton"
import { ProblemAlert } from "./ProblemAlert"

type CartFlowProps = {
  data: CartPageData
  copy: CartPageCopy
}

type Step = "cart" | "details" | "done"

/** The live menu's answer for the cart's day, applied. */
type Checked = { date: IsoDate; status: DayStatus; notes: Record<string, LineNote>; removed: string[]; max: Record<string, number> }

const TITLE_ID = "cart-title"

/** The day a refusal says the cart's day is now in. */
const REFUSED: Record<"DAY_FULL" | "DAY_CLOSED" | "CUTOFF_PASSED", DayStatus> = {
  DAY_FULL: "full",
  DAY_CLOSED: "closed",
  CUTOFF_PASSED: "cutoff",
}

const neverChanges = () => () => {}

function checkedFrom(result: CartCheck, outcome: ReturnType<typeof reconcile>): Checked {
  return { date: result.date, status: result.status, notes: outcome.notes, removed: outcome.removed, max: outcome.max }
}

/**
 * /cart — cart → your details → order sent, three states in one route with no navigation between them
 * (dev-docs/implementation.md 6.3). On mount the cart is checked against the live menu: lines off it go, prices
 * and quantities left are refreshed, and one notice says what changed. Place order sends one idempotency key per
 * attempt (a resend after a dropped connection can't order twice); a refusal keeps the cart and the details and
 * names the way forward. The header's Back steps from details to the cart.
 */
export function CartFlow({ data, copy }: CartFlowProps) {
  const c = copy.cart
  const router = useRouter()
  const { cart, count, subtotalPaise, setQuantity, replace, clear } = useCart()
  // The cart lives in localStorage: until the browser has read it, show neither the lines nor "empty".
  const hydrated = useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  )
  const [step, setStep] = useState<Step>("cart")
  const [checked, setChecked] = useState<Checked | null>(null)
  const [moving, setMoving] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [clearAsk, setClearAsk] = useState(false)
  const [note, setNote] = useState("")
  // Read once on the client; the details form isn't on screen at hydration, so the server's empty values never show.
  const [saved] = useState(() => (typeof window === "undefined" ? null : readCustomer()))
  const [details, setDetails] = useState<DetailsValues>(() => ({
    name: saved?.name ?? "",
    phone: saved?.phone ?? "",
    type: data.pickup.enabled || !data.delivery.enabled ? "PICKUP" : "DELIVERY",
    address: saved?.address ?? "",
  }))
  const [errors, setErrors] = useState<DetailsField[]>([])
  const [problem, setProblem] = useState<Problem | null>(null)
  const [pausedReason, setPausedReason] = useState<string | null>(null)
  const [placed, setPlaced] = useState<PlacedSummary | null>(null)
  const [pending, startTransition] = useTransition()
  const attempt = useRef<string | null>(null)
  const checkedFor = useRef<string | null>(null)

  // Revalidate on mount (and when another tab moves the cart to a new day).
  useEffect(() => {
    if (!cart || checkedFor.current === cart.fulfilmentDate) return
    const date = cart.fulfilmentDate
    checkedFor.current = date
    checkCart({ date, ids: cart.items.map((line) => line.menuItemId) })
      .then((result) => {
        const current = getCart()
        if (!result || !current || current.fulfilmentDate !== date) return
        const outcome = reconcile(current, result, Date.now())
        if (outcome.cart !== current) replace(outcome.cart)
        setChecked(checkedFrom(result, outcome))
      })
      .catch(() => {
        // Offline, or the server is down: the cart stays as it is, and Place order checks everything again.
      })
  }, [cart, replace])

  const goTo = useCallback((next: Step) => {
    setStep(next)
    setClearAsk(false)
    setProblem(null)
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 })
      document.getElementById(TITLE_ID)?.focus({ preventScroll: true })
    })
  }, [])
  const toCart = useCallback(() => goTo("cart"), [goTo])
  usePageBack(step === "details" && cart && !pending ? toCart : null)

  if (!hydrated) {
    return (
      <div role="status" className="flex min-h-40 items-center justify-center">
        <Spinner size="lg" />
        <span className="sr-only">{c.loading}</span>
      </div>
    )
  }

  if (step === "done" && placed) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <CartHeading id={TITLE_ID} title={c.titles.done} />
        <Confirmed order={placed} today={data.today} pickup={data.pickup} phone={data.phone} copy={copy} />
      </div>
    )
  }

  const date = cart?.fulfilmentDate ?? null
  const fresh = checked && checked.date === date ? checked : null
  const removedText = checked?.removed.length
    ? fill(c.removed, { day: dayName(checked.date, data.today, copy), names: checked.removed.join(", ") })
    : null

  if (!cart || !date) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <CartHeading id={TITLE_ID} title={c.titles.cart} />
        {removedText ? <Notice tone="warm">{removedText}</Notice> : null}
        <EmptyState
          message={c.empty}
          action={
            <ButtonLink href="/" size="lg" className="font-semibold">
              {c.browse}
            </ButtonLink>
          }
        />
      </div>
    )
  }

  const today = data.today
  const day = data.days.find((entry) => entry.date === date) ?? null
  const status: DayStatus = fresh?.status ?? day?.status ?? "unplanned"
  const notes = fresh?.notes ?? {}
  const lineMax = (id: string) => fresh?.max[id] ?? MAX_LINE_QTY
  const soldOut = cart.items.some((line) => notes[line.menuItemId] === "soldOut")
  const changed = cart.items.filter((line) => notes[line.menuItemId]).length + (fresh?.removed.length ?? 0)
  const next = data.days.find((entry) => entry.status === "open" && entry.date !== date) ?? null
  const type: Fulfilment = details.type
  const feePaise = type === "DELIVERY" ? data.delivery.feePaise : 0
  const title = dayTitle(date, today, copy)
  const problemTitle = dayProblem(status, date, day, today, copy)

  const changeLine = (line: CartLine, qty: number) => {
    setQuantity(
      {
        menuItemId: line.menuItemId,
        slug: line.slug,
        name: line.name,
        pricePaise: line.priceSnapshot,
        imageId: line.imageId,
        date,
        max: Math.max(lineMax(line.menuItemId), line.qty),
      },
      qty,
    )
    if (problem?.kind === "item" && problem.menuItemId === line.menuItemId) setProblem(null)
    if (qty === 0 && cart.items.length === 1) goTo("cart")
  }

  const moveTo = (target: IsoDate) => {
    if (moving) return
    setMoving(true)
    checkCart({ date: target, ids: cart.items.map((line) => line.menuItemId) })
      .then((result) => {
        const current = getCart()
        if (!result || !current) return
        const outcome = reconcile(current, result, Date.now())
        checkedFor.current = target
        replace(outcome.cart)
        setChecked(checkedFrom(result, outcome))
        setProblem(null)
        setSheetOpen(false)
        attempt.current = null
        if (!outcome.cart) goTo("cart")
        router.refresh()
      })
      .catch(() => setProblem({ kind: "network" }))
      .finally(() => setMoving(false))
  }

  const markDay = (dayStatus: DayStatus) =>
    setChecked((prev) => (prev && prev.date === date ? { ...prev, status: dayStatus } : { date, status: dayStatus, notes: {}, removed: [], max: {} }))

  const refused = (refusal: CheckoutRefusal) => {
    switch (refusal.reason) {
      case "DAY_FULL":
      case "DAY_CLOSED":
      case "CUTOFF_PASSED":
        markDay(REFUSED[refusal.reason])
        router.refresh()
        return
      case "ORDERING_PAUSED":
        setPausedReason(refusal.message)
        markDay("paused")
        return
      case "ITEM_UNAVAILABLE": {
        const { menuItemId, remaining } = refusal
        setProblem({ kind: "item", menuItemId, name: refusal.name, remaining })
        setChecked((prev) => {
          const base = prev && prev.date === date ? prev : { date, status, notes: {}, removed: [], max: {} }
          return {
            ...base,
            max: { ...base.max, [menuItemId]: remaining },
            notes: { ...base.notes, [menuItemId]: remaining > 0 ? "fewer" : "soldOut" },
          }
        })
        return
      }
      case "INVALID":
        if (refusal.field) {
          setErrors([refusal.field])
          document.getElementById(FIELD_IDS[refusal.field])?.focus()
        } else setProblem({ kind: "invalid" })
        return
      case "FULFILMENT_UNAVAILABLE":
        setProblem({ kind: "fulfilment" })
        router.refresh()
        return
      case "RATE_LIMITED":
        setProblem({ kind: "rateLimited" })
        return
    }
  }

  const place = () => {
    if (pending || status !== "open") return
    const problems = detailsProblems(details)
    setErrors(problems)
    if (problems.length > 0) {
      document.getElementById(FIELD_IDS[problems[0]])?.focus()
      return
    }
    attempt.current ??= crypto.randomUUID()
    const input = {
      idempotencyKey: attempt.current,
      fulfilmentDate: date,
      fulfilmentType: type,
      name: details.name,
      phone: details.phone,
      address: type === "DELIVERY" ? details.address : null,
      note: note.trim() || null,
      items: cart.items.map((line) => ({ menuItemId: line.menuItemId, quantity: line.qty })),
    }
    setProblem(null)
    startTransition(async () => {
      try {
        const result = await createOrder(input)
        if (!result.ok) {
          // Nothing was created under that key: the next try is a new attempt.
          attempt.current = null
          refused(result)
          return
        }
        saveCustomer({ name: details.name.trim(), phone: details.phone.trim(), address: details.address.trim() || undefined })
        attempt.current = null
        setPlaced(result.order)
        clear()
        goTo("done")
      } catch {
        // The order may or may not have gone in: the key is kept, so trying again can't place it twice.
        setProblem({ kind: "network" })
      }
    })
  }

  const fixItem = () => {
    if (problem?.kind !== "item") return
    const line = cart.items.find((entry) => entry.menuItemId === problem.menuItemId)
    setProblem(null)
    if (line) changeLine(line, problem.remaining)
  }

  const p = c.problems
  const dayBody =
    status === "paused"
      ? (pausedReason ?? p.pausedBody)
      : [status === "full" && step === "details" ? p.fullBody : null, next ? null : p.noOtherDay, step === "details" ? p.kept : null]
          .filter(Boolean)
          .join(" ")
  const dayAlert = problemTitle ? (
    <ProblemAlert
      title={problemTitle}
      body={dayBody || undefined}
      action={
        status !== "paused" && next ? (
          <Button size="lg" className="w-full font-semibold" disabled={moving} onClick={() => moveTo(next.date)}>
            {moving ? c.moving : fill(c.move, { day: dayTitle(next.date, today, copy) })}
          </Button>
        ) : null
      }
    />
  ) : null
  const problemAlert = problem ? <OrderProblem problem={problem} phone={data.phone} onFixItem={fixItem} copy={copy} /> : null

  const dayCard = (change: boolean) => (
    <DayCard
      label={c.dayLabel[type]}
      title={title}
      meta={dayMeta(status, date, day, today, copy)}
      change={change && data.days.length > 1 ? { label: c.changeDay, onClick: () => setSheetOpen(true), disabled: moving } : undefined}
    />
  )
  const items = { label: c.itemsRow, value: String(count) }
  const sheet = (
    <DaySheet
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      current={date}
      days={data.days}
      today={today}
      type={type}
      busy={moving}
      onPick={moveTo}
      copy={copy}
    />
  )

  if (step === "details") {
    const totalPaise = subtotalPaise + feePaise
    const options = [
      data.pickup.enabled
        ? {
            type: "PICKUP" as const,
            title: c.details.PICKUP,
            sub: [data.pickup.address[0] ?? null, pickupHours(data.pickup.hours, date, copy)].filter(Boolean).join(", ") || null,
          }
        : null,
      data.delivery.enabled
        ? {
            type: "DELIVERY" as const,
            title: c.details.DELIVERY,
            sub:
              [
                data.delivery.radiusKm ? fill(c.details.radius, { km: data.delivery.radiusKm }) : null,
                data.delivery.feePaise > 0 ? fill(c.details.fee, { fee: formatPaise(data.delivery.feePaise) }) : null,
              ]
                .filter(Boolean)
                .join(" · ") || null,
          }
        : null,
    ].filter((option) => option !== null)
    const action =
      status === "open" ? (
        <PlaceButton
          label={fill(c.details.place, { total: formatPaise(totalPaise) })}
          busyLabel={c.details.placing}
          busy={pending}
          onPlace={place}
          className="min-w-0 flex-1 lg:w-full lg:flex-none"
        />
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="min-w-0 flex-1 text-small text-pretty text-muted">{c.details.chooseDay}</span>
          <Button variant="outline" size="lg" disabled>
            {c.details.placePlain}
          </Button>
        </div>
      )

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 lg:max-w-5xl">
        <CartHeading id={TITLE_ID} title={c.titles.details} />
        <DetailsStep
          summaryText={fill(c.details.summary, { items: itemsText(count, copy), total: formatPaise(subtotalPaise), day: title })}
          editLabel={c.details.edit}
          onEdit={toCart}
          alerts={
            <>
              {dayAlert}
              {problemAlert}
            </>
          }
          form={
            <DetailsForm
              values={details}
              onChange={(patch) => {
                setDetails((prev) => ({ ...prev, ...patch }))
                setErrors((prev) => prev.filter((field) => !(field in patch)))
                if (patch.type && problem?.kind === "fulfilment") setProblem(null)
              }}
              errors={errors}
              welcome={saved !== null}
              options={options}
              copy={copy}
            />
          }
          dayCard={dayCard(false)}
          summary={
            <CartSummary
              rows={feePaise > 0 ? [items, { label: c.deliveryFee, value: formatPaise(feePaise) }] : [items]}
              totalLabel={c.total}
              total={formatPaise(totalPaise)}
              pay={c.payLater[type]}
            />
          }
          expectation={<Expectation strong={c.details.expectStrong} rest={c.details.expectRest} />}
          action={action}
          busy={pending}
        />
        {sheet}
      </div>
    )
  }

  const blocked = status !== "open" ? "" : soldOut ? c.soldOutBlock : null
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 lg:max-w-5xl">
      <CartHeading
        id={TITLE_ID}
        title={c.titles.cart}
        action={
          <Button variant="quiet" onClick={() => setClearAsk(true)} aria-expanded={clearAsk}>
            {c.clear}
          </Button>
        }
      />
      <CartStep
        cart={cart}
        notes={notes}
        lineMax={lineMax}
        onLine={changeLine}
        alerts={
          <>
            {clearAsk ? (
              <ClearConfirm
                question={fill(c.clearAsk, { items: itemsText(count, copy) })}
                keepLabel={c.clearKeep}
                clearLabel={c.clearDo}
                onKeep={() => setClearAsk(false)}
                onClear={() => {
                  setClearAsk(false)
                  setChecked(null)
                  clear()
                }}
              />
            ) : null}
            {changed > 0 ? (
              <Notice tone="warm" title={changed === 1 ? c.updatedOne : fill(c.updated, { count: changed })}>
                {removedText}
              </Notice>
            ) : null}
            {dayAlert}
            {problemAlert}
          </>
        }
        dayCard={dayCard(true)}
        summary={<CartSummary rows={[items]} totalLabel={c.subtotal} total={formatPaise(subtotalPaise)} pay={c.payLater[type]} />}
        note={note}
        onNote={setNote}
        blocked={blocked}
        onContinue={() => {
          attempt.current = null
          goTo("details")
        }}
        subtotal={formatPaise(subtotalPaise)}
        copy={copy}
      />
      {sheet}
    </div>
  )
}
