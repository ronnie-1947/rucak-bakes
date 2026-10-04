# cart

The cart (`/cart`): **cart → your details → order sent**, three states in one route with no navigation between them (runbook 6.3).
Imported from `Cart.dc.html`. Route: [src/app/(store)/cart/page.tsx](<../../app/(store)/cart/page.tsx>), inside the store shell. Read model:
[src/lib/storefront/cart.ts](../../lib/storefront/cart.ts); actions: [src/app/actions/checkout.ts](../../app/actions/checkout.ts) (`checkCart`,
`createOrder`); cart model: [src/lib/cart/](../../lib/cart/); checkout rules and results: [src/lib/orders/checkout.ts](../../lib/orders/checkout.ts).

## Files in this folder

```
cart/
  Cart.tsx             entry (server) — picks the strings the browser needs, renders CartFlow
  CartFlow.tsx         "use client" — the state machine: step, live-menu check, move day, details, Place order, refusals
  CartHeading.tsx      "use client" — the step's h1 (focus target on step change), handed to the store header (usePageTitle)
  CartStep.tsx         state 1 — day card, lines, Add more items, note, summary; Continue in the side card / phone bar
  DetailsStep.tsx      state 2 — summary row, alerts, the form, expectation; Place order in the side card / phone bar
  Confirmed.tsx        state 3 — order code, phone back, what was ordered (server-priced), what happens next
  StepLayout.tsx       one column, then 3 : 2 with the sticky side card from 1024px
  ActionBar.tsx        the step's action pinned to the bottom under 1024px, with its spacer
  CartLineRow.tsx      one line: photo, name (links to the item on the cart's day), price each + change tag, Remove, stepper, total
  DayCard.tsx          the o500 card — Pickup day / Delivery day, "Saturday, 10 Oct", order-by and orders left, Change day
  DaySheet.tsx         "use client" — Change day (Dialog: sheet on phones, dialog from 640px)
  DayChoice.tsx        one day in that list — current / open / off
  CartSummary.tsx      Items, Delivery, Subtotal or Total, "Pay at pickup — nothing is charged now."
  NoteField.tsx        "Anything we should know?" — allergies go here
  SummaryRow.tsx       "3 items · ₹660 · Saturday, 10 Oct" + Edit
  DetailsForm.tsx      name, phone (+91), pickup / delivery, address; FIELD_IDS
  FulfilmentChoice.tsx pickup / delivery as native radios in one frame
  Expectation.tsx      "We’ll call you within 2 hours to confirm. Your order isn’t final until then."
  PlaceButton.tsx      Place order · ₹X, spinner while it sends
  ProblemAlert.tsx     the red block — title, body, one action
  OrderProblem.tsx     Place order's refusals (item gone, fulfilment off, rate limited, invalid, network) → ProblemAlert; `Problem`
  ConfirmedRow.tsx     one fact of the placed order
  NextStep.tsx         one of "What happens next"
  copy.ts              CartPageCopy, day titles / meta / problems, pickup hours, itemsText
  README.md
```

## Component tree

```
Cart data dict.store
└─ CartFlow data copy
   ├─ (before the browser has read the cart)  Spinner, "Opening your cart…"
   ├─ empty:     CartHeading · Notice (what a move took out) · EmptyState → Browse the menu
   ├─ cart:      CartHeading + Clear
   │             CartStep
   │             ├─ ClearConfirm · Notice "2 items … changed" · ProblemAlert (day can't take it → Move to …) · OrderProblem
   │             ├─ DayCard (phones/tablets) · ul > CartLineRow × n · Add more items · NoteField · CartSummary
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
| `@/lib/cart/*` | `reconcile` + `CartCheck` / `LineNote` (check.ts), `readCustomer` / `saveCustomer` (customer.ts), `getCart` (store.ts) |
| `@/lib/orders/checkout` | `detailsProblems`, `CheckoutRefusal`, `PlacedSummary`, field limits |
| `@/lib/storefront/*` | `CartPageData` / `CartDay` (cart.ts), `DayStatus`, `relativeDay`, `itemHref` |
| `@/lib/settings/hours` · `@/lib/calendar/cutoffs` | `weekdayKey` for pickup hours, `formatClock` |
| `@/components/ui/*` | `Button` (`underline`, `quiet`), `ButtonLink`, `Dialog`, `EmptyState`, `Field`, `TextInput` (`inputClasses`, `inputShellClasses`), `Icon` (`close`, `flame`, `bag`), `ItemThumb`, `Notice`, `Spinner` (`tone="inverse"`), `Stepper`, `Tag` |

Tokens: `bg-o500`, `bg-o50`, `text-o700`, `bg-red-soft`, `text-red`, `bg-green-soft`, `text-green`, `border-border(-strong)`, `rounded-card`,
`rounded-button`, `rounded-panel`, `text-glance`, `text-h1`, `text-h2`, `text-small`, `text-micro`, `font-display`, `shadow-raised`, utility
`pb-safe`; breakpoints `xs`, `sm` (Dialog), `md`, `lg`.

## Props

```ts
Cart        { data: CartPageData; dict: Dict["store"] }
CartFlow    { data: CartPageData; copy: CartPageCopy }
CartStep    { cart; notes; lineMax; onLine; alerts; dayCard; summary; note; onNote; blocked: string | null; onContinue; subtotal; copy }
DetailsStep { summaryText; editLabel; onEdit; alerts; form; dayCard; summary; expectation; action; busy }
Confirmed   { order: PlacedSummary; today; pickup: CartPageData["pickup"]; phone: string | null; copy }
DaySheet    { open; onClose; current; days: CartDay[]; today; type; busy; onPick; copy }
DetailsForm { values: DetailsValues; onChange; errors: DetailsField[]; welcome; options; copy }
```

`CartPageCopy` is `{ cart: dict.store.cart, days, shell, item: { decrease, increase } }` — only what the client flow renders.

## Dictionary contract

`store.cart` in `src/content/en.json`: `titles`, Clear (`clear*`), `empty` / `browse` / `loading`, the day card (`labels`, `dayLabel`,
`dayTitle`, `orderBy`, `ordersLeft`, `changeDay`), lines (`each`, `notes`, `remove*`, `addMore`), `note*`, money (`itemsRow`, `subtotal`,
`deliveryFee`, `total`, `payLater`), `continue`, `updated*`, `removed`, `soldOutBlock`, `move` / `moving`, `sheet.*`, `details.*`,
`problems.*` (7.2's customer copy), `done.*`. Also `store.days`, `store.shell.items*`, `store.item.decrease` / `increase`.

## How it works

- **Hydration.** The cart is in localStorage, so the server renders a spinner and the browser renders the real state — never a flash of
  "Your cart is empty". The saved customer (`bakery.customer`) is read in a lazy `useState`; the form isn't on screen at hydration.
- **Revalidate on mount.** `checkCart(date, ids)` returns each line as the day's menu has it; `reconcile` removes lines no longer on it,
  lowers quantities above what's left ("Only 2 left"), refreshes prices ("Price updated"), and keeps sold-out lines flagged so the customer
  removes them knowingly (Continue waits). One warm notice counts what changed and names what was taken out. Offline, the cart stays and
  Place order checks again.
- **The day.** The card shows "Order by 6pm today · 9 of 15 orders left" (overbookLimit − live orders, as on `/`), or why the day can't take
  the order — then a red alert offers **Move to <next open day>**. Change day lists every planned day of the order-ahead window. Moving
  runs `checkCart` for the new day and carries over what that day bakes (deviation: the design cleared the cart; the sheet says what happens).
- **Place order.** The form's rules (`detailsProblems`) run first and focus the first bad field. One idempotency key per attempt (made on
  the first tap after Continue): a refusal drops it (nothing was created), a network failure keeps it, so a retry can never order twice.
  Success saves the customer, clears the cart and shows state 3 from the server's own summary.
- **Refusals** (7.2): DAY_FULL / CUTOFF_PASSED / DAY_CLOSED turn the day card and alert red and offer Move; ORDERING_PAUSED shows the
  owner's reason verbatim; ITEM_UNAVAILABLE names the item and offers "Change to n" or "Remove it and continue"; RATE_LIMITED offers the
  bakery's number; FULFILMENT_UNAVAILABLE refreshes the options. Items and details are always kept.
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
| What the live check changes | `reconcile` in [src/lib/cart/check.ts](../../lib/cart/check.ts) |
| Form rules, limits, refusal shapes | [src/lib/orders/checkout.ts](../../lib/orders/checkout.ts) |
| Rate limits | [src/lib/orders/rate-limit.ts](../../lib/orders/rate-limit.ts) |
| What the server does with an order | `createOrder` in [src/app/actions/checkout.ts](../../app/actions/checkout.ts) → `placeOrder` |
| Which days Change day lists | `loadCartPage` in [src/lib/storefront/cart.ts](../../lib/storefront/cart.ts) |

## Do not

- No payment fields, progress stepper, coupon code or account creation — state 2 must not look like e-commerce checkout.
- Never send a price: the server prices the order. Cart prices are display-only.
- Never generate the idempotency key per request — once per attempt, kept across a network failure.
- No inline `style`, no hardcoded strings.
