"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react"
import { checkCart, createOrder } from "@/app/actions/checkout"
import { Button } from "@/components/ui/Button"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { EmptyState } from "@/components/ui/EmptyState"
import { Notice } from "@/components/ui/Notice"
import { Skeleton } from "@/components/ui/Skeleton"
import { useCart } from "@/hooks/useCart"
import { usePageBack } from "@/hooks/usePageTitle"
import { useStoreInfo } from "@/hooks/useStoreInfo"
import { type CartLine, MAX_LINE_QTY } from "@/lib/cart/cart"
import { type CartDayStatus, type CartCheck, type LineNote, lineNotice, reconcile, sheetDays, viewCartDay } from "@/lib/cart/check"
import { readCustomer, saveCustomer } from "@/lib/cart/customer"
import { getCart } from "@/lib/cart/store"
import { formatLongDayLabel, type IsoDate, todayIn } from "@/lib/dates"
import { formatPaise } from "@/lib/money"
import { type CheckoutRefusal, type DetailsField, type DetailsValues, detailsProblems, type PlacedSummary } from "@/lib/orders/checkout"
import type { BookingWindow } from "@/lib/orders/deadline"
import { noticeChip, noticeLength } from "@/lib/storefront/words"
import { fill } from "@/lib/template"
import { CartHeading } from "./CartHeading"
import { CartSkeleton } from "./CartSkeleton"
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
  copy: CartPageCopy
}

type Step = "cart" | "details" | "done"

/** The live check's answer, applied: what changed on the lines, what was taken out, and the booking window as it now stands. */
type Checked = { notes: Record<string, LineNote>; removed: string[]; window: BookingWindow }

const TITLE_ID = "cart-title"

/** The day a refusal says the cart's day is now in — until the next check brings the fresh window. */
const REFUSED: Record<"DAY_FULL" | "DAY_CLOSED" | "CUTOFF_PASSED", CartDayStatus> = {
  DAY_FULL: "full",
  DAY_CLOSED: "closed",
  CUTOFF_PASSED: "cutoff",
}

const neverChanges = () => () => {}

/**
 * /cart — cart → your details → order sent, three states in one route with no navigation between them
 * (dev-docs/implementation.md 6.3, reworked by §10R). On mount the cart is checked against the menu: lines that can't be
 * ordered online any more go, prices and notices are refreshed, and the cart's day is judged with the deadline rule —
 * lines whose notice makes it too soon are flagged with Move to <the earliest date for every line>. Place order sends one
 * idempotency key per attempt (a resend after a dropped connection can't order twice); a refusal keeps the cart and the
 * details and names the way forward. The header's Back steps from details to the cart. The page is static: pickup, delivery
 * and the phone come with the store shell (useStoreInfo), the booking window with the check — the only request it makes.
 */
export function CartFlow({ copy }: CartFlowProps) {
  const c = copy.cart
  const router = useRouter()
  const info = useStoreInfo()
  const { cart, count, subtotalPaise, setQuantity, replace, clear } = useCart()
  // The cart lives in localStorage: until the browser has read it, show neither the lines nor "empty".
  const hydrated = useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  )
  const [step, setStep] = useState<Step>("cart")
  const [checked, setChecked] = useState<Checked | null>(null)
  const [refusedDay, setRefusedDay] = useState<{ date: IsoDate; status: CartDayStatus } | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [clearAsk, setClearAsk] = useState(false)
  const [note, setNote] = useState("")
  const [checkFailed, setCheckFailed] = useState(false)
  // Read once on the client; the details form isn't on screen at hydration, so the server's empty values never show.
  const [saved] = useState(() => (typeof window === "undefined" ? null : readCustomer()))
  const [details, setDetails] = useState<DetailsValues>(() => ({
    name: saved?.name ?? "",
    phone: saved?.phone ?? "",
    type: info.pickup.enabled || !info.delivery.enabled ? "PICKUP" : "DELIVERY",
    address: saved?.address ?? "",
  }))
  const [errors, setErrors] = useState<DetailsField[]>([])
  const [problem, setProblem] = useState<Problem | null>(null)
  const [pausedReason, setPausedReason] = useState<string | null>(null)
  const [placed, setPlaced] = useState<PlacedSummary | null>(null)
  const [pending, startTransition] = useTransition()
  const attempt = useRef<string | null>(null)
  const checkedIds = useRef(new Set<string>())

  /**
   * Asks the server about the cart's lines and the window, and applies the answer. Offline, the cart stays as it is — once a
   * window has come, Place order checks everything again; before that, `checkFailed` offers Try again.
   */
  const recheck = useCallback(() => {
    const ids = getCart()?.items.map((line) => line.menuItemId) ?? []
    if (ids.length === 0) return
    ids.forEach((id) => checkedIds.current.add(id))
    checkCart({ ids })
      .then((result) => applyCheck(result))
      .catch(() => setCheckFailed(true))

    function applyCheck(result: CartCheck | null) {
      const current = getCart()
      if (!result) setCheckFailed(true)
      if (!result || !current) return
      const outcome = reconcile(current, result, Date.now())
      if (outcome.cart !== current) replace(outcome.cart)
      setChecked({ notes: outcome.notes, removed: outcome.removed, window: result.window })
      setCheckFailed(false)
      setRefusedDay(null)
    }
  }, [replace])

  /** Every line comes along — any orderable item can be ordered for any date its notice allows. */
  const moveTo = useCallback(
    (target: IsoDate) => {
      const current = getCart()
      if (current) replace({ ...current, fulfilmentDate: target, updatedAt: Date.now() })
      setRefusedDay(null)
      setProblem(null)
      setSheetOpen(false)
      attempt.current = null
      // The window may have moved on since the page loaded — refresh it for the new day.
      recheck()
    },
    [replace, recheck],
  )

  // Revalidate on mount, and when a line arrives that hasn't been checked (another tab added it).
  useEffect(() => {
    if (cart && cart.items.some((line) => !checkedIds.current.has(line.menuItemId))) recheck()
  }, [cart, recheck])

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

  // The window as the last check saw it — null until the first answers. Never `window` — that's the browser's.
  const booking = checked?.window ?? null
  const today = booking?.today ?? todayIn(info.timeZone)

  if (!hydrated) return <CartSkeleton label={c.loading} />

  if (step === "done" && placed) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <CartHeading id={TITLE_ID} title={c.titles.done} />
        <Confirmed order={placed} today={today} pickup={info.pickup} phone={info.phone} copy={copy} />
      </div>
    )
  }

  const date = cart?.fulfilmentDate ?? null
  const removedText = checked?.removed.length ? fill(c.removed, { names: checked.removed.join(", ") }) : null

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

  const type: Fulfilment = details.type
  const items = { label: c.itemsRow, value: String(count) }
  const noticeOf = (line: CartLine) => (line.noticeDays === undefined ? null : noticeChip(line.noticeDays, true, copy.notice))

  const changeLine = (line: CartLine, qty: number) => {
    setQuantity(
      {
        menuItemId: line.menuItemId,
        slug: line.slug,
        name: line.name,
        pricePaise: line.priceSnapshot,
        grams: line.grams,
        imageId: line.imageId,
        date,
        max: MAX_LINE_QTY,
        noticeDays: line.noticeDays,
      },
      qty,
    )
    if (qty === 0 && problem?.kind === "tooSoon") setProblem(null)
    if (qty === 0 && cart.items.length === 1) goTo("cart")
  }

  // Until the first check answers there's no window to judge the day by: the lines show, the day card waits, Continue waits.
  if (!booking) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 lg:max-w-5xl">
        <CartHeading id={TITLE_ID} title={c.titles.cart} />
        <CartStep
          cart={cart}
          lineInfo={(line) => ({ note: undefined, notice: noticeOf(line), flag: null })}
          onLine={changeLine}
          alerts={
            checkFailed ? (
              <ProblemAlert
                title={c.checkFailed}
                action={
                  <Button
                    size="lg"
                    className="w-full font-semibold"
                    onClick={() => {
                      setCheckFailed(false)
                      recheck()
                    }}
                  >
                    {c.retry}
                  </Button>
                }
              />
            ) : null
          }
          dayCard={<Skeleton tone="warm" className="h-24 rounded-card" />}
          summary={<CartSummary rows={[items]} totalLabel={c.subtotal} total={formatPaise(subtotalPaise)} pay={c.payLater[type]} />}
          note={note}
          onNote={setNote}
          blocked=""
          onContinue={() => {}}
          subtotal={formatPaise(subtotalPaise)}
          copy={copy}
        />
      </div>
    )
  }

  const view = viewCartDay(cart, booking)
  const status: CartDayStatus = refusedDay?.date === date ? refusedDay.status : view.status
  const notes = checked?.notes ?? {}
  const rows = sheetDays(cart, booking)
  const feePaise = type === "DELIVERY" ? info.delivery.feePaise : 0
  const title = dayTitle(date, today, copy)
  const problemTitle = dayProblem(status, date, view, booking, copy)

  const refused = (refusal: CheckoutRefusal) => {
    switch (refusal.reason) {
      case "DAY_FULL":
      case "DAY_CLOSED":
      case "CUTOFF_PASSED":
        setRefusedDay({ date, status: REFUSED[refusal.reason] })
        recheck()
        return
      case "TOO_SOON":
        setProblem({ kind: "tooSoon", date: refusal.date, name: refusal.name, notice: refusal.notice, earliest: refusal.earliest })
        recheck()
        return
      case "ORDERING_PAUSED":
        setPausedReason(refusal.message)
        setRefusedDay({ date, status: "paused" })
        return
      case "ITEM_UNAVAILABLE": {
        const line = cart.items.find((entry) => entry.menuItemId === refusal.menuItemId)
        const name = refusal.name ?? line?.name ?? null
        if (name) setChecked((prev) => ({ notes: prev?.notes ?? {}, window: booking, removed: [...(prev?.removed ?? []), name] }))
        if (line) changeLine(line, 0)
        setProblem({ kind: "item", name })
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
        // Pickup and delivery come with the shell, which the settings actions revalidate.
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
      items: cart.items.map((line) => ({ menuItemId: line.menuItemId, quantity: line.qty, grams: line.grams })),
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

  const p = c.problems
  const next = view.earliest
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
          <Button size="lg" className="w-full font-semibold" onClick={() => moveTo(next)}>
            {fill(c.move, { day: dayTitle(next, today, copy) })}
          </Button>
        ) : null
      }
    />
  ) : null
  const problemAlert = problem ? (
    <OrderProblem problem={problem} phone={info.phone} today={today} onMove={moveTo} onChooseDay={() => setSheetOpen(true)} copy={copy} />
  ) : null

  const tooSoon = new Set(view.tooSoon.map((line) => line.menuItemId))
  const lineInfo = (line: CartLine) => ({
    note: notes[line.menuItemId],
    notice: noticeOf(line),
    flag: tooSoon.has(line.menuItemId)
      ? {
          text: fill(c.flag, { notice: noticeLength(lineNotice(line), copy.notice), day: dayName(date, today, copy) }),
          moveLabel: next ? fill(c.move, { day: dayName(next, today, copy) }) : c.chooseDay,
          onMove: () => (next ? moveTo(next) : setSheetOpen(true)),
        }
      : null,
  })

  const dayCard = (change: boolean) => (
    <DayCard
      label={c.dayLabel[type]}
      title={title}
      meta={dayMeta(status, date, view, booking, copy)}
      change={change && rows.length > 1 ? { label: c.changeDay, onClick: () => setSheetOpen(true) } : undefined}
    />
  )
  const sheet = (
    <DaySheet
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      current={date}
      rows={rows}
      booking={booking}
      type={type}
      onPick={moveTo}
      copy={copy}
    />
  )

  if (step === "details") {
    const totalPaise = subtotalPaise + feePaise
    const options = [
      info.pickup.enabled
        ? {
            type: "PICKUP" as const,
            title: c.details.PICKUP,
            sub: [info.pickup.address[0] ?? null, pickupHours(info.pickup.hours, date, copy)].filter(Boolean).join(", ") || null,
          }
        : null,
      info.delivery.enabled
        ? {
            type: "DELIVERY" as const,
            title: c.details.DELIVERY,
            sub:
              [
                info.delivery.radiusKm ? fill(c.details.radius, { km: info.delivery.radiusKm }) : null,
                info.delivery.feePaise > 0 ? fill(c.details.fee, { fee: formatPaise(info.delivery.feePaise) }) : null,
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
          summaryText={fill(c.details.summary, { items: itemsText(count, copy), total: formatPaise(subtotalPaise), day: formatLongDayLabel(date) })}
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

  const blocked = status !== "open" ? "" : null
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
        lineInfo={lineInfo}
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
                  setChecked((prev) => (prev ? { ...prev, notes: {}, removed: [] } : null))
                  clear()
                }}
              />
            ) : null}
            {removedText ? <Notice tone="warm">{removedText}</Notice> : null}
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
