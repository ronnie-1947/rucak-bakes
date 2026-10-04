# admin-calendar-day

The day editor at `/admin/calendar/[date]` ([page](<../../app/admin/(shell)/calendar/[date]/page.tsx>)) — screen B of
`Admin Calander & Calander date.dc.html` (revised for order ahead, §10R). Everything about one day: the orders booked for
it, its **counter-items** (what's baked for the counter — how many, any price override, Sold out), open or closed, when
orders close, how many orders to verify and the overbook limit, and the note customers see. Data: [src/lib/calendar/day.ts](../../lib/calendar/day.ts); rules shared with the server:
[src/lib/calendar/form.ts](../../lib/calendar/form.ts); saving: `saveMenuDay` in
[src/app/actions/calendar.ts](../../app/actions/calendar.ts) → `saveDay` in [src/lib/calendar/writes.ts](../../lib/calendar/writes.ts).

## Files in this folder

```
admin-calendar-day/
  AdminCalendarDay.tsx  entry (server) — DayEditor keyed by date
  DayEditor.tsx         "use client" — header, read-only note, the grid (orders + counter-items · settings + save card · preview), save bar, dialogs
  useDayEditor.ts       the editor's state: plan vs saved, open rows, search/category, sold out, save / discard, copy-from
  DayHeader.tsx         back, "Saturday 3 Oct" + Open/Closed badge, Copy counter-items from another day, ‹ ›; every exit goes through the leave check
  ClosedLine.tsx        "This day is closed. Customers can’t order for …" above the orders
  OrdersSection.tsx     "Orders for this day" + Add order (?date=, inside the booking window, 7R.5) + Open in Orders: "6 orders · 4 verified · 2 pending", Meter, "6 of 10 orders taken", the rows
  DayOrderRow.tsx       one order, linked: name, code, status badge; its lines; "Pickup 08:00" + Allergen / Note tag
  ItemPicker.tsx        "Counter-items made this day": Select all / Clear all, intro, search, category chips, PlanStrip, groups (or none / no match)
  ItemGroup.tsx         a category: sticky header "3 of 4 on", then its rows
  ItemRow.tsx           tick ("Bake X as a counter-item"), 48px photo, name, base price, "12 made", Override / Sold out tags, chevron
  ItemControls.tsx      the opened row: Quantity made Stepper (0–99) + "Usual batch 8", ₹ override, Sold out / Undo sold out
  PlanStrip.tsx         <1024: sticky "5 counter-items · 86 pieces"
  DaySettings.tsx       Day status (+ why closed), Orders close (+ how much earlier a long-notice item closes), Max verified orders,
                        Overbook limit, Day note — each with its consequence line
  SaveStatus.tsx        dot + "2 changes not saved" / "1 price to fix" / "All changes saved"; the last save's problem
  SaveActions.tsx       Discard · Save day
  SaveCard.tsx          ≥1024: summary, status, actions at the foot of the sticky settings column
  SaveBar.tsx           <1024: sticky bottom bar while there's something to save (or just was)
  DayPreview.tsx        ≥1600: Fresh today as customers see it, unsaved edits included — status, note, counter-items, walk in / Call
  PreviewRow.tsx        one counter-item in that preview: photo, name, the day's price, Sold out (faded)
  CopyDaySheet.tsx      "Copy counter-items from another day": nearby days → "Replace this day’s counter-items?" (changes the form only)
  LeaveDialog.tsx       "Leave without saving?" — n unsaved changes to the day
  copy.ts               itemsText ("5 counter-items"), unitsText ("86 pieces"), planSummary, namesPreview
  types.ts              AdminCopy, DayCopy
  README.md
```

## Component tree

```
AdminCalendarDay dict=dict.admin data
└─ DayEditor                                              .calendarDay.*
   ├─ DayHeader · Notice (ui, past days)
   ├─ fieldset[disabled on past days]
   │  ├─ ClosedLine (closed) · OrdersSection > Meter (ui), DayOrderRow × n > StatusBadge, Tag (ui)
   │  │  · fieldset[disabled when closed] > ItemPicker
   │  │                                                    ├─ TextInput, Chip × n, PlanStrip, EmptyState (ui)
   │  │                                                    └─ ItemGroup × n > ItemRow × n > SelectBox, ItemThumb, Tag (ui), ItemControls > Stepper, Button (ui)
   │  ├─ DaySettings > Switch, SelectField, Stepper × 2, Field + TextInput (ui) · SaveCard > SaveStatus, SaveActions
   │  └─ DayPreview > PreviewRow × n
   ├─ SaveBar > SaveStatus, SaveActions                    (<1024)
   ├─ CopyDaySheet · LeaveDialog                           Dialog (ui)
   └─ CloseDayDialog (src/components/close-day-dialog)     .closeDay.*
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/calendar/day` | `loadDayEditor` → `DayEditorData`, `EditorItem`, `EditorOrder`, `CopySource` |
| `@/lib/calendar/form` | `DayPlan`, `ItemPlan`, `changeCount`, `overrideProblems`, `overridePaise`, `withMaxOrders`, limits |
| `@/lib/calendar/cutoffs` | cutoff choices, keys, labels, `formatClock` |
| `@/app/actions/calendar` | `saveMenuDay` |
| `@/components/close-day-dialog/CloseDayDialog` | the confirm naming the day's orders |
| `@/components/ui/*` | `Button`/`buttonClasses`, `ButtonLink`, `Chip`, `Container`, `Dialog`, `EmptyState`, `Field`, `ItemThumb`, `Notice`, `SelectBox`, `SelectField`, `Stepper`, `Switch`, `Tag`, `TextInput`/`inputShellClasses`, icons |
| `@/lib/dates` · `@/lib/money` · `@/lib/template` | `computeCutoffAt`, `formatLongDayLabel`, `addDays` · `formatPaise` · `fill` |

Tokens: `bg-o500` (switch, chips, Override tag, unsaved dot), `border-o500` (an override field), `text-o700` (links, preview prices),
`border-red`/`text-red`/`bg-red-soft` (closed with orders, Sold out, Allergen), `bg-green-soft`/`text-green` (Open, saved), `bg-sunken`,
`shadow-raised` (strip, save bar), `rounded-panel/chip/pill`, `pb-safe`, breakpoints `md`, `lg`, `2xl`.

## Props

```ts
AdminCalendarDay { dict: AdminCopy; data: DayEditorData }
DayEditor        { data; dict }
DayHeader        { title; badge: "open" | "closedWithOrders" | "closed"; backHref; prevHref; nextHref; onCopy: (() => void) | null; onLeave(event, href); dict: DayCopy }
ClosedLine       { text }
OrdersSection    { data; maxOrders; dict: AdminCopy }
DayOrderRow      { order: EditorOrder; dict: AdminCopy }
ItemPicker       { data; editor: DayEditor; dict: AdminCopy }
ItemGroup        { name; items; all; editor; dict: DayCopy["items"] }
ItemRow          { item; plan: ItemPlan; expanded; onToggle; onExpand; onQuantity; onOverride; onSoldOut; dict }
ItemControls     { item; plan; onQuantity; onOverride; onSoldOut; dict }
PlanStrip        { editor; dict: AdminCopy }
DaySettings      { data; editor; dict: AdminCopy }
SaveStatus       { editor; dict: DayCopy["save"] }
SaveActions      { editor; stretch; dict: DayCopy["save"] }
SaveCard         { editor; dict: AdminCopy }
SaveBar          { editor; dict: DayCopy["save"] }
DayPreview       { data; editor; dict: AdminCopy }
PreviewRow       { name; image; pricePaise; soldOut; soldOutLabel }
CopyDaySheet     { data; editor; dict: AdminCopy; onClose }
LeaveDialog      { day; changes; dict: DayCopy["leave"]; onClose; onLeave }
```

## How it works

- **Orders for this day** come first — every live order by pickup time, each linking to it, with a red Allergen tag when the
  note names one (`lib/daysheet/notes.ts`) and an orange Note tag otherwise. The meter counts all live orders against the max
  being edited. It stays fully visible on a closed day.
- **Counter-items** (§10R) — every active menu item, plus anything already on the day (an inactive or archived one shows a tag;
  it can be taken off, not added). Ticked = baked for the counter that day; customers see them under Fresh today and can't
  order them online. Orders never draw them down, so any can be changed or taken off. Search and category chips only narrow
  the list. Ticking an item opens its controls; its quantity starts at the item's usual counter batch.
- **Sold out** (`MenuDayItem.soldOutAt`) marks that the counter ran out — the quantity made stays, Fresh today shows it sold
  out. It saves with the day; the first time it's set is kept. Undo sold out clears it.
- **Price override** is per day, typed in rupees; empty or equal to the base price stores nothing. The row shows
  "Override ₹260" and the field "+₹20 vs base ₹240".
- **Closing** a day with orders opens `CloseDayDialog` from the switch; the save then sends `confirmClose`. If the page didn't
  know about the orders, the save is refused with them and the same dialog confirms and saves. Closing never touches orders.
  While closed, the item list and the other settings rest (dimmed, disabled) and a "Why it’s closed" note appears — staff
  only, shown on the week card.
- **Orders close** says when customers can order until, and — when an orderable item needs more notice than the day's own
  cutoff — how much earlier that item closes (the deadline rule, `orders/deadline.ts`).
- **Max verified orders** can't pass the **Overbook limit** (`overbookLimit`: orders taken in all before the day shows fully
  booked — a database CHECK): raising max past it raises it.
- **Copy counter-items from another day** offers the days nearest this one with counter-items (and always the same weekday
  last week); confirming replaces the ticked counter-items and quantities in the form and clears overrides and sold-out marks.
  The day's orders aren't touched. Nothing is saved until Save day.
- **Leaving** with unsaved changes — Back, ‹, › — asks first; a reload or tab close gets the browser's prompt.
- **Past days** render read-only (one disabled fieldset) with no save bar and no copy.

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` | one column: orders, counter-items, then settings; title and badge stacked; Copy full width; chips scroll sideways; sticky strip + save bar |
| `md` (768, the 820px kitchen tablet) | settings 2×2; item controls three across; chips wrap; title and badge in a row; Copy beside them |
| `lg` (1024) | orders + counter-items 62% · sticky settings column 38% with the save card; strip and save bar go away |
| `2xl` (1600) | orders + counter-items 45% · settings 30% · Fresh today preview 25% |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component. The 820px tablet matters most.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.calendarDay`, `admin.cutoffs`, `admin.closeDay` |
| A rule (limits, what counts as a change) | `src/lib/calendar/form.ts` — the save action re-checks with the same limits |
| What saving writes or refuses | `saveDay` in `src/lib/calendar/writes.ts`, `saveInput` in `src/app/actions/calendar.ts` |
| Which days Copy counter-items from another day offers | `loadDayEditor` in `src/lib/calendar/day.ts` (`SOURCE_WINDOW`, `SOURCE_COUNT`) |

## Do not

- Close a day with orders without the confirm.
- Tie a counter-item to orders — orders are their own lines (§10R); `quantityOrdered` no longer moves.
