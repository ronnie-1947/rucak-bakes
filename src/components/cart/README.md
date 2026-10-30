# cart

The cart (`/cart`): **cart → your details → order sent**, three states in one route with no navigation between them (runbook 6.3,
reworked by §10R — every order is an order-ahead order, judged by the one deadline rule in `src/lib/orders/deadline.ts`).
Imported from `Cart.dc.html` (revised 4 Oct). Route: [src/app/(store)/cart/page.tsx](<../../app/(store)/cart/page.tsx>), inside the store shell —
static (build shows `○ /cart`). Pickup, delivery and the phone come with the store shell (`useStoreInfo`); the booking window with
`checkCart` (read model `checkLines` in [src/lib/storefront/cart.ts](../../lib/storefront/cart.ts)); actions: [src/app/actions/checkout.ts](../../app/actions/checkout.ts) (`checkCart`,
`createOrder`); cart model: [src/lib/cart/](../../lib/cart/); checkout rules and results: [src/lib/orders/checkout.ts](../../lib/orders/checkout.ts).

## Files in this folder

```
cart/
  Cart.tsx             entry (server) — picks the strings the browser needs, renders CartFlow
  CartSkeleton.tsx     the cart step's shape in Skeleton blocks (heading, day card, two lines, side card) — the static HTML, until hydration
  CartFlow.tsx         "use client" — the state machine: step, live-menu check, move day, details, Place order, refusals
  CartHeading.tsx      "use client" — the step's h1 (focus target on step change), handed to the store header (usePageTitle)
  CartStep.tsx         state 1 — day card, lines, Add more items, note, summary; Continue in the side card / phone bar
  DetailsStep.tsx      state 2 — summary row, alerts, the form, expectation; Place order in the side card / phone bar
  Confirmed.tsx        state 3 — order code, phone back, what was ordered (server-priced), what happens next
  StepLayout.tsx       one column, then 3 : 2 with the sticky side card from 1024px
  ActionBar.tsx        the step's action pinned to the bottom under 1024px, with its spacer
  CartLineRow.tsx      one line: photo, name (links to the item on the cart's day), "1.5 kg · ₹720 each · Order 2 days ahead" + Price updated,
                       Remove, stepper 1–99, total; the too-soon flag under it
  TooSoonFlag.tsx      "Needs 3 days’ notice — too soon for Saturday" + Remove / Move to Tuesday (or Choose another day)
  DayCard.tsx          the o500 card — Pickup day / Delivery day, "Saturday, 10 Oct", "Order by Thursday 6pm · 3 orders left that day", Change day
  DaySheet.tsx         "use client" — Change day (Dialog: sheet on phones, dialog from 640px): the window's days for every line
  DayChoice.tsx        one day in that list — current / open / off, the reason or deadline under it, a worded side note
  CartSummary.tsx      Items, Delivery, Subtotal or Total, "Pay at pickup — nothing is charged now."
  NoteField.tsx        "Anything we should know?" — allergies go here
  SummaryRow.tsx       "3 items · ₹660 · Saturday, 10 Oct" + Edit
  DetailsForm.tsx      name, phone (+91), pickup / delivery, address; FIELD_IDS
  FulfilmentChoice.tsx pickup / delivery as native radios in one frame
  Expectation.tsx      "We’ll call you within 2 hours to confirm. Your order isn’t final until then."
  PlaceButton.tsx      Place order · ₹X, spinner while it sends
  ProblemAlert.tsx     the red block — title, body, one action
  OrderProblem.tsx     Place order's refusals (too soon, item can't be ordered, fulfilment off, rate limited, invalid, network)
                       → ProblemAlert; `Problem`
  ConfirmedRow.tsx     one fact of the placed order
  NextStep.tsx         one of "What happens next"
  copy.ts              CartPageCopy, day titles / meta / problems, "Order by …" from a deadline, orders left, pickup hours, itemsText
  README.md
```

## Component tree

```
Cart dict.store
└─ CartFlow copy                                (pickup / delivery / phone: useStoreInfo)
      ├─ (before hydration)  CartSkeleton — sr-only "Opening your cart…"
      ├─ empty:     CartHeading · Notice (what the check took out) · EmptyState → Browse the menu
      ├─ checking:  CartHeading · CartStep — the lines, a warm Skeleton for the day card, Continue disabled
      │             └─ ProblemAlert "We couldn’t check your cart…" → Try again   (the first check failed)
      ├─ cart:      CartHeading + Clear
      │             CartStep
      │             ├─ ClearConfirm · Notice (taken out: no longer on the menu) · ProblemAlert (day can't take it → Move to …) · OrderProblem
      │             ├─ DayCard (phones/tablets) · ul > CartLineRow (+ TooSoonFlag) × n · Add more items · NoteField · CartSummary
      │             ├─ StepLayout side (lg): DayCard · CartSummary · Continue
      │             └─ ActionBar (<lg): Subtotal · Continue
      ├─ details:   CartHeading
      │             DetailsStep (fieldset, locked while sending)
      │             ├─ SummaryRow · ProblemAlert / OrderProblem · DetailsForm (FulfilmentChoice) · CartSummary · Expectation
      │             ├─ side (lg): DayCard · CartSummary · Expectation · PlaceButton
      │             └─ ActionBar (<lg): PlaceButton, or "Choose a new day…" + disabled
      ├─ done:      CartHeading · Confirmed (ConfirmedRow × n, NextStep × 3, ActionBar)
      └─ DaySheet (DayChoice × days)
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/app/actions/checkout` | `checkCart` (lines vs the live menu), `createOrder` (7.1–7.3) |
| `@/hooks/useCart` | the cart: `setQuantity`, `replace`, `clear`, `count`, `subtotalPaise` |
| `@/hooks/usePageTitle` | `usePageTitle` (CartHeading), `usePageBack` (details → cart on the header's Back) |
| `@/lib/cart/*` | `reconcile`, `viewCartDay`, `sheetDays` + `CartCheck` / `LineNote` / `CartDayStatus` (check.ts), `readCustomer` / `saveCustomer` (customer.ts), `getCart` (store.ts) |
| `@/lib/orders/deadline` | `BookingWindow`, `FEW_ORDERS_LEFT`, `ordersLeft` — the deadline rule (check.ts applies it) |
| `@/lib/orders/checkout` | `detailsProblems`, `CheckoutRefusal`, `PlacedSummary`, field limits |
| `@/hooks/useStoreInfo` | `StoreInfo` from the store shell — pickup (address, hours), delivery (fee, radius), phone, timezone |
| `@/lib/storefront/*` | `StoreInfo` (types.ts), `relativeDay` / `noticeChip` / `noticeLength` (words.ts), `itemHref` |
| `@/lib/settings/hours` · `@/lib/calendar/cutoffs` | `weekdayKey` for pickup hours, `formatClock` |
| `@/components/ui/*` | `Button` (`underline`, `quiet`), `ButtonLink`, `Dialog`, `EmptyState`, `Field`, `TextInput` (`inputClasses`, `inputShellClasses`), `Icon` (`close`, `flame`, `bag`), `ItemThumb`, `Notice`, `Skeleton` (`warm` for the day card), `Spinner` (`tone="inverse"`), `Stepper`, `Tag` |

Tokens: `bg-o500`, `bg-o50`, `text-o700`, `bg-red-soft`, `text-red`, `bg-green-soft`, `text-green`, `border-border(-strong)`, `rounded-card`,
`rounded-button`, `rounded-panel`, `text-glance`, `text-h1`, `text-h2`, `text-small`, `text-micro`, `font-display`, `shadow-raised`, utility
`pb-safe`; breakpoints `xs`, `sm` (Dialog), `md`, `lg`.

## Props

```ts
Cart        { dict: Dict["store"] }
CartSkeleton { label: string }
CartFlow    { copy: CartPageCopy }
CartStep    { cart; lineInfo: (line) => { note; notice; flag }; onLine; alerts; dayCard; summary; note; onNote; blocked: string | null; onContinue; subtotal; copy }
DetailsStep { summaryText; editLabel; onEdit; alerts; form; dayCard; summary; expectation; action; busy }
Confirmed   { order: PlacedSummary; today; pickup: StoreInfo["pickup"]; phone: string | null; copy }
DaySheet    { open; onClose; current; rows: SheetDay[]; booking: BookingWindow; type; onPick; copy }
DetailsForm { values: DetailsValues; onChange; errors: DetailsField[]; welcome; options; copy }
```

`CartPageCopy` is `{ cart: dict.store.cart, days, notice, shell, item: { decrease, increase } }` — only what the client flow renders.

## Dictionary contract

`store.cart` in `src/content/en.json`: `titles`, Clear (`clear*`), `empty` / `browse` / `loading` / `checkFailed` / `retry`, the day card (`labels`, `dayLabel`,
`dayTitle`, `orderBy` / `orderByToday`, `ordersLeft*`, `tooSoonAll`, `changeDay`), lines (`each`, `notes`, `flag`, `chooseDay`, `remove*`,
`addMore`), `note*`, money (`itemsRow`, `subtotal`, `deliveryFee`, `total`, `payLater`), `continue`, `removed`, `move` / `moving`, `sheet.*`,
`details.*`, `problems.*` (7.2's customer copy + `tooSoon*`), `done.*`. Also `store.days`, `store.notice` (the notice chip and "3 days’
notice", shared with the menu cards), `store.shell.items*`, `store.item.decrease` / `increase`.

## How it works

- **Static page, one request.** `/cart` is prerendered: the shell and `CartSkeleton` are in the HTML until hydration, so it paints at
  once and never flashes "Your cart is empty". Pickup, delivery and the phone are settings — they come with the store shell
  (`StoreInfo`, `useStoreInfo`), which the settings actions revalidate, so FULFILMENT_UNAVAILABLE is a `router.refresh()`. The booking
  window moves with every order and the clock, so it isn't kept anywhere: it comes with `checkCart`. An empty cart makes no request;
  a cart with lines shows them at once and holds the day card (a warm Skeleton) and Continue until the first check answers — if it
  fails, Try again. `today` is the window's, else worked out in the browser from the bakery's timezone. The saved customer
  (`bakery.customer`) is read in a lazy `useState`.
- **Revalidate on mount.** `checkCart(ids)` returns each line as the menu has it (orderable, price, sold by weight, notice) and the booking window
  (`BookingWindow`: today … today + orderAheadDays, planned or from the defaults, with orders taken). `reconcile` removes lines that can't be
  ordered online any more (one warm notice names them), refreshes prices ("Price updated"), names, photos and notices. A by-weight line
  is priced at its size (`sizedPrice`); an older line of a PER_KG item without one becomes one piece of its quantity in kilos, and a line
  whose item stopped being sold by weight drops its size. There is no stock: no
  quantity caps, no sold-out lines. A line arriving from another tab triggers another check. Offline, the cart stays and Place order checks again.
- **The day** (`viewCartDay`). The card shows "Order by Thursday 6pm · 3 orders left that day" — the earliest deadline over the lines that
  fit, orders left only when ≤ 3 — or "Too soon for every item". When the day itself can't take an order (paused, closed, past its own
  cutoff, fully booked) a red alert offers **Move to <the earliest date for every line>** and Place order waits. A line whose notice makes the
  date too soon gets the flag under it — Remove, or Move to <earliest> (none → Choose another day opens the sheet); Continue still works and
  the server refuses with TOO_SOON. **Change day** (`sheetDays`) lists tomorrow to the end of the window: each date's deadline for every line,
  or why it can't be picked (closed › fully booked › ordering closed › too soon for <the longest-notice line>); "3 orders left" when nearly
  full. Moving keeps every line and is instant; a background check refreshes the window.
- **Place order.** The form's rules (`detailsProblems`) run first and focus the first bad field. One idempotency key per attempt (made on
  the first tap after Continue): a refusal drops it (nothing was created), a network failure keeps it, so a retry can never order twice.
  Success saves the customer, clears the cart and shows state 3 from the server's own summary.
- **Refusals** (7.2): DAY_FULL / CUTOFF_PASSED / DAY_CLOSED turn the day card and alert red and offer Move (until the next check brings the
  fresh window); TOO_SOON says "Too soon for Saturday — Custom birthday cake needs 3 days’ notice — the earliest is Tuesday 13 Oct." with
  Move to Tuesday, once, inline; ORDERING_PAUSED shows the owner's reason verbatim; ITEM_UNAVAILABLE takes the line out and names it;
  RATE_LIMITED offers the bakery's number; FULFILMENT_UNAVAILABLE refreshes the options. Items and details are always kept.
- **Back.** On the details step the header's Back returns to the cart (`usePageBack`); otherwise it leaves as on any store page. The
  header's cart button is hidden here.

## Responsive behavior

| Width | Effect |
|---|---|
| base | one column; line stepper and total drop under the name; bottom ActionBar (Continue / Place order / Back to menu + Call) |
| `xs` 480px | stepper and total move beside the line |
| `sm` 640px | Change day becomes a centred dialog instead of a sheet |
| `md` 768px | content capped at 768px; What happens next three across |
| `lg` 1024px | 3 : 2 with the sticky side card (day, money, action); ActionBar gone; content capped at 1024px; confirmed stays at 672px |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Copy | `src/content/en.json` → `store.cart` |
| What the live check changes, how the day and Change day are judged | `reconcile`, `viewCartDay`, `sheetDays` in [src/lib/cart/check.ts](../../lib/cart/check.ts) |
| The deadline rule itself | [src/lib/orders/deadline.ts](../../lib/orders/deadline.ts) — shared with placeOrder and every other screen |
| Form rules, limits, refusal shapes | [src/lib/orders/checkout.ts](../../lib/orders/checkout.ts) |
| Rate limits | [src/lib/orders/rate-limit.ts](../../lib/orders/rate-limit.ts) |
| What the server does with an order | `createOrder` in [src/app/actions/checkout.ts](../../app/actions/checkout.ts) → `placeOrder` |
| Which days Change day lists | `loadBookingWindow` in [src/lib/orders/booking.ts](../../lib/orders/booking.ts) |

## Do not

- No payment fields, progress stepper, coupon code or account creation — state 2 must not look like e-commerce checkout.
- Never send a price: the server prices the order. Cart prices are display-only.
- Never generate the idempotency key per request — once per attempt, kept across a network failure.
- No inline `style`, no hardcoded strings.
