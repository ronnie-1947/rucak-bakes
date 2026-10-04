# admin-new-order

Staff enter an order that didn't come through the website: a customer calls, or walks in to book Saturday's cake
(dev-docs/implementation.md 7R.5). Route: [src/app/admin/(shell)/orders/new/page.tsx](<../../app/admin/(shell)/orders/new/page.tsx>).
Imported from `Admin-create-orders.dc.html`. Read model: [src/lib/orders/new-order.ts](../../lib/orders/new-order.ts); rules shared
with the server: [src/lib/orders/staff-order.ts](../../lib/orders/staff-order.ts); saving: `createStaffOrder` in
[src/app/actions/orders.ts](../../app/actions/orders.ts), which runs `placeOrder` with its staff rules.

Often filled in **while talking to the customer**, so the cards follow the conversation — who → what → when → notes — and the
total and Add order are always in reach.

## Files in this folder

```
admin-new-order/
  AdminNewOrder.tsx   entry (server) — picks the dict slices, keys the form by the URL's ?date= / ?customer=
  NewOrderForm.tsx    "use client" — layout: top bar, header, closed-day alert, the four cards, summary card / bar / sheet, dialogs
  useNewOrder.ts      the form's state: customer + lookup, lines, when, notes, warnings, what's missing, submit, leave guard
  TopBar.tsx          <768: sticky back + "New order"
  PageHeader.tsx      the intro line; ≥768 with an outlined back button and the h1
  ClosedDayAlert.tsx  red notice when the picked day is closed + "Open calendar" (that day's editor)
  FormCard.tsx        one card: h2 (+ an aside like "3 lines"), 16px padding, 1px border
  CustomerSection.tsx phone, the lookup's answer, name
  PhoneField.tsx      "+91" cell + tel input, spaced "98765 43210" as typed
  KnownCustomer.tsx   sunken block: name + CustomerFlags, "Ordered before (6) · last on 21 Sep", address, View customer; Blocked line
  ItemsSection.tsx    the lines (or the empty line), the custom-price warning, then MenuPicker
  OrderLine.tsx       name (wraps), remove ×, Stepper 1–99, MoneyInput price + unit, line total; Custom price · Menu ₹x · Reset
  MenuPicker.tsx      "Add from the menu": search, category Chips, MenuPickRow × n — a client filter, no URL state
  MenuPickRow.tsx     thumb, name + "Call only", "₹240 each", Add → ✓ Added (Button `done`)
  WhenSection.tsx     ModeChoice, DayStrip, the day's line + Meter, date warnings, pickup time or address + fee
  ModeChoice.tsx      Pickup / Delivery — two radios in one 48px frame
  DayStrip.tsx        role=listbox of 56×64 chips: weekday, date, Open / "2 left" / Full / Closed (disabled), orange dot
  MoneyInput.tsx      "₹" cell + numeric input; `price` 112px, `fee` 128px; `accent` border when custom
  NotesSection.tsx    customer's note (red Allergen tag + frame via mentionsAllergen), internal note
  SummaryBody.tsx     who, phone, when, each line (card: Custom price tag · sheet: "₹1,200 per kg · menu ₹1,500"), fee, total, warnings
  SummaryCard.tsx     ≥768: Summary + RefusalNotice + AddButton — after the form, sticky beside it from 1280
  SummaryBar.tsx      <768: sticky above the tab bar — "3 items · ₹2,760 ⌃ / Tap for details" + AddButton
  SummarySheet.tsx    the bar's sheet (Dialog) with SummaryBody variant="sheet"
  AddButton.tsx       Add order, or what's missing ("Add a phone number" …) drawn neutral and disabled
  RefusalNotice.tsx   why the last Add order was refused, above the button
  FullDayDialog.tsx   "Saturday is fully booked" / "It already has 10 orders (10 of 10 verified)…" — Back · Add anyway
  LeaveDialog.tsx     "Discard this order?" — Keep editing · Discard
  copy.ts             warningText, whenText, eachText, addLabel, refusalText
  days.ts             dayOptions — each day of the window as a chip (look, word, title, dot)
  draft.ts            rupees / parseRupees / cleanRupees — the money fields' text ⇄ paise
  types.ts            AdminCopy, NewOrderCopy, FormCopy, Mode, DraftLine, FormLine, LookupState, Refusal, FullCounts
  README.md
```

## Component tree

```
AdminNewOrder dict=dict.admin page formKey
└─ NewOrderForm key=formKey                         dict.admin.newOrder (+ customerFlags, priceUnits)
   ├─ TopBar (<md)                                  .back · .title
   ├─ Container
   │  ├─ PageHeader                                 .intro (+ .back · .title ≥md)
   │  └─ grid
   │     ├─ column
   │     │  ├─ ClosedDayAlert (closed day)          .closedDay · .openCalendar
   │     │  ├─ CustomerSection > FormCard, PhoneField, KnownCustomer > CustomerFlags, Field + TextInput   .customer.*
   │     │  ├─ ItemsSection > FormCard, OrderLine × n > Stepper, MoneyInput, Tag; Notice; MenuPicker > Chip, MenuPickRow × n   .items.*
   │     │  ├─ WhenSection > FormCard, ModeChoice, DayStrip, Meter, Notice × n, SelectField | textarea + MoneyInput   .when.*
   │     │  └─ NotesSection > FormCard, Tag      .notes.*
   │     └─ SummaryCard (≥md) > SummaryBody, RefusalNotice, AddButton   .summary.* · .warnings.* · .missing.* · .refusals.*
   ├─ SummaryBar (<md) > RefusalNotice, AddButton
   ├─ SummarySheet > Dialog > SummaryBody variant="sheet"
   ├─ FullDayDialog > Dialog                         .full.*
   └─ LeaveDialog > Dialog                           .leave.*
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/orders/new-order` | `NewOrderPage`, `NewOrderItem` (from `loadNewOrder`) |
| `@/lib/orders/staff-order` | `staffOrderWarnings`, `missingStep`, `staffRoom`, `noticeRunOut`, `typedPhone`, `INTERNAL_NOTE_MAX` |
| `@/lib/orders/deadline` | `pastCutoff`, `FEW_ORDERS_LEFT`, `BookingWindow` — the same deadline rule as the checkout |
| `@/app/actions/orders` · `@/app/actions/customers` | `createStaffOrder` · `findCustomerByPhone` |
| `@/lib/customers/lookup` | `CustomerLookup` |
| `@/lib/daysheet/notes` | `mentionsAllergen` — the day sheet's allergen words |
| `@/lib/calendar/cutoffs` · `@/lib/calendar/routes` · `@/lib/dates` | `formatClock`, `dayHref`, day labels |
| `@/lib/money` · `@/lib/phone` · `@/lib/storefront/words` · `@/lib/template` | `formatPaise`/`toPaise`/`MAX_PRICE_PAISE`, `normalise`, `noticeLength`, `fill` |
| `@/components/customer-flags/CustomerFlags` | Trusted / Blocked / New |
| `@/components/ui/*` | `Button` (`done` for ✓ Added), `ButtonLink`, `Chip`, `Container`, `Dialog`, `Field`, `ItemThumb`, `Meter`, `Notice`, `SelectField`, `Stepper`, `Tag`, `TextInput`/`inputClasses`/`inputShellClasses`, icons |

External: `next/link`, `next/navigation`. Tokens: `bg-o500` (picked day, chosen mode, the dot), `border-o500` (custom price), `text-o700`,
`bg-red-soft`/`text-red` (full, allergen, refusals), `text-green` (Open), `bg-sunken`, `rounded-panel`, `rounded-button`, `shadow-raised`,
`text-h1`, `text-h2`, `text-small-admin`, `text-micro`, breakpoints `md`, `xl`, `2xl`.

## Props

```ts
AdminNewOrder   { dict: AdminCopy; page: NewOrderPage; formKey: string }
NewOrderForm    { page; dict: FormCopy }
TopBar          { onBack; dict: NewOrderCopy }
PageHeader      { onBack; dict: NewOrderCopy }
ClosedDayAlert  { date; dict: NewOrderCopy }
FormCard        { id; title; aside?; children }
CustomerSection { form: NewOrderForm; dict: FormCopy }
PhoneField      { value; onChange(raw); dict: NewOrderCopy["customer"] }
KnownCustomer   { customer: CustomerLookup; onLeave(href) → asked; dict: FormCopy }
ItemsSection    { form; dict: FormCopy }
OrderLine       { line: FormLine; form; dict: FormCopy }
MenuPicker      { form; dict: FormCopy }
MenuPickRow     { item: NewOrderItem; added; onAdd; dict: FormCopy }
WhenSection     { form; dict: FormCopy }
ModeChoice      { value: Mode; onChange; dict: NewOrderCopy["when"] }
DayStrip        { options: DayOption[]; selected; onSelect; label; caption }
MoneyInput      { id?; value; onChange; label?; width: "price" | "fee"; frame? }
NotesSection    { form; dict: NewOrderCopy["notes"] }
SummaryBody     { form; variant: "card" | "sheet"; dict: FormCopy }
SummaryCard     { form; dict: FormCopy }
SummaryBar      { form; dict: NewOrderCopy }
SummarySheet    { form; dict: FormCopy }
AddButton       { form; placement: "card" | "bar"; dict: NewOrderCopy }
RefusalNotice   { refusal: Refusal | null; dict: NewOrderCopy }
FullDayDialog   { form; dict: NewOrderCopy }
LeaveDialog     { form; dict: NewOrderCopy["leave"] }
```

## How it works

- **The rules (decided 4 Oct)** — a staff order is VERIFIED at once by whoever adds it; staff may set a line's price; it may book
  past the cutoff, past an item's notice, a call-only item, and while the website is paused or pickup / delivery is switched off;
  a full day only after the confirm. Closed and past days, inactive and archived items are refused. No rate limit, no Telegram.
  The server is the truth (`placeOrder`'s `staff` rules); this screen only warns.
- **Customer** — the phone field keeps ten digits behind its fixed +91 (a pasted "+91 …" or "0…" loses the prefix). At a full,
  valid number `findCustomerByPhone` looks it up (exact match): a known customer fills in the name (unless staff typed one) and
  their saved address (unless one is typed); unknown → "New customer — they'll be added when you save." A slower answer for an
  older number is dropped. `?customer=<id>` starts with their phone and name.
- **Lines** — one per item: Add twice is a no-op (✓ Added); quantity lives on the line. Each line keeps a snapshot of the item
  (name, unit, menu price, notice), so a refresh that takes the item off the menu still shows it, flagged "No longer on the
  menu". The price field starts at the menu price; an empty field means the menu price; anything else is custom (orange border,
  tag, "Menu ₹1,500", Reset) and is the only price ever sent — `unitPricePaise: null` otherwise. Capped at ₹1,00,000.
- **Day** — the booking window's days (`loadBookingWindow`). Full = verified ≥ `maxOrders` or live ≥ `overbookLimit`
  (`staffRoom` ≤ 0) — a staff order is verified at once, so both limits count; "2 left" from three down. The orange dot marks a
  day past its own cutoff, full, or too soon for a line (`noticeRunOut`: a notice longer than the day's cutoff whose deadline has
  passed). Closed is disabled. Starting day: `?date=` when it's in the window (a closed one shows the alert), else the first open
  day after today with room. The day's line counts live orders against `maxOrders`, as the Calendar card does.
- **Pickup times** — every half hour inside that weekday's opening hours (`pickupSlots`; the default hours when none are saved or the
  owner opened a usually-closed day), shown 12-hour, stored "HH:MM". Changing day drops a time the new day doesn't offer.
- **Warnings** (`staffOrderWarnings`) — past the day's cutoff, each line too soon, custom prices (count and the difference against the
  menu). Shown in the cards they belong to and again in the summary; none of them stops the order.
- **Add order** — disabled and named for the first gap: phone › name › item › open day › (delivery) address. On a full day it asks
  first (FullDayDialog). The idempotency key is made once per form and kept across retries and the confirm. Answers: ok →
  `/admin/orders/{id}?added=1` (the order page's green "added" line); DAY_FULL → the confirm with the server's counts; DAY_CLOSED /
  PAST_DATE / ITEM_UNAVAILABLE → the refusal line and a refresh of the page's data (what's entered stays); INVALID → which field;
  a dropped connection → "It won't be added twice." (same key on retry).
- **Leaving** — Back (and View customer) with anything entered opens "Discard this order?"; a tab close or reload gets the
  browser's prompt.

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` | sticky TopBar; one column; the date strip bleeds to the card's edge; summary bar above the tab bar (the Add button drops to its own row at 320px when its label is long); summary as a bottom sheet |
| `md` (768, kitchen tablet) | outlined back + h1; one column capped at 640px; the summary card after the form, no bar |
| `xl` (1280) | form 62% · sticky summary 38% |
| `2xl` (1600) | columns 640px and 400px |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.newOrder` |
| What can be booked | `placeOrder` staff rules in `src/lib/orders/place.ts`; the warnings in `src/lib/orders/staff-order.ts` |
| What's loaded | `loadNewOrder` in `src/lib/orders/new-order.ts` |
| A field | `staffOrderSchema` (`staff-order.ts`), `createStaffOrder`, `useNewOrder`, a control in its card |

## Do not

- Fork a second order transaction for staff — the day's capacity is counted under one lock in `placeOrder`.
- Send the menu price as a custom price — only a changed price travels; the server stores the menu's beside it.
- Let a closed day be picked — staff open it in the Calendar first.
