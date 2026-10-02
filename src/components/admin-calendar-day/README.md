# admin-calendar-day

The day editor at `/admin/calendar/[date]` ([page](<../../app/admin/(shell)/calendar/[date]/page.tsx>)) — screen B of
`Admin Calander & Calander date.dc.html`. Everything about one day: which menu items are on sale, how many of each, any
price override, Sold out, open or closed, when orders close, how many orders to verify and accept, and the note
customers see. Data: [src/lib/calendar/day.ts](../../lib/calendar/day.ts); rules shared with the server:
[src/lib/calendar/form.ts](../../lib/calendar/form.ts); saving: `saveMenuDay` in
[src/app/actions/calendar.ts](../../app/actions/calendar.ts) → `saveDay` in [src/lib/calendar/writes.ts](../../lib/calendar/writes.ts).

## Files in this folder

```
admin-calendar-day/
  AdminCalendarDay.tsx  entry (server) — DayEditor keyed by date
  DayEditor.tsx         "use client" — header, read-only note, the grid (items · settings + save card · preview), save bar, dialogs
  useDayEditor.ts       the editor's state: plan vs saved, ordered counts, open rows, search/category, conflicts, save / discard, copy-from
  DayHeader.tsx         back, "Saturday 3 Oct" + Open/Closed badge, Copy from another day, ‹ ›; every exit goes through the leave check
  ClosedLine.tsx        "This day is closed. Customers can’t order for …" above the resting list
  ItemPicker.tsx        "Items on this day": Select all / Clear all, search, category chips, PlanStrip, groups (or empty / no match)
  ItemGroup.tsx         a category: sticky header "3 of 4 on", then its rows
  ItemRow.tsx           tick, 48px photo, name, base price, "12 available · 3 ordered", override chip, chevron
  ItemControls.tsx      the opened row: quantity Stepper + "3 of 12 ordered", ₹ override, Sold out, the red conflict line
  PlanStrip.tsx         <1024: sticky "7 items · 108 units available" + conflict count
  DaySettings.tsx       Day status (+ why closed), Orders close, Max verified orders, Orders to accept, Day note — each with its consequence line
  SaveStatus.tsx        dot + "2 changes not saved" / "1 quantity conflict — fix to save" / "All changes saved"; the last save's problem
  SaveActions.tsx       Discard · Save day
  SaveCard.tsx          ≥1024: summary, status, actions at the foot of the sticky settings column
  SaveBar.tsx           <1024: sticky bottom bar while there's something to save (or just was)
  DayPreview.tsx        ≥1600: the day as a customer sees it, unsaved edits included
  PreviewRow.tsx        one item in that preview: photo, name, the day's price, Sold out
  CopyDaySheet.tsx      "Copy from another day": nearby planned days → "Replace this day’s items?" (changes the form only)
  LeaveDialog.tsx       "Leave without saving?" — n unsaved changes to the day
  copy.ts               itemsText, unitsText, planSummary, namesPreview
  types.ts              AdminCopy, DayCopy
  README.md
```

## Component tree

```
AdminCalendarDay dict=dict.admin data
└─ DayEditor                                              .calendarDay.*
   ├─ DayHeader · Notice (ui, past days)
   ├─ fieldset[disabled on past days]
   │  ├─ ClosedLine (closed) · fieldset[disabled when closed] > ItemPicker
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
| `@/lib/calendar/day` | `loadDayEditor` → `DayEditorData`, `EditorItem`, `CopySource` |
| `@/lib/calendar/form` | `DayPlan`, `ItemPlan`, `changeCount`, `quantityConflicts`, `overrideProblems`, `overridePaise`, `withMaxOrders`, limits |
| `@/lib/calendar/cutoffs` | cutoff choices, keys, labels, `formatClock` |
| `@/app/actions/calendar` | `saveMenuDay` |
| `@/components/close-day-dialog/CloseDayDialog` | the confirm naming the day's orders |
| `@/components/ui/*` | `Button`/`buttonClasses`, `ButtonLink`, `Chip`, `Container`, `Dialog`, `EmptyState`, `Field`, `ItemThumb`, `Notice`, `SelectBox`, `SelectField`, `Stepper`, `Switch`, `Tag`, `TextInput`/`inputShellClasses`, icons |
| `@/lib/dates` · `@/lib/money` · `@/lib/template` | `computeCutoffAt`, `formatLongDayLabel`, `addDays` · `formatPaise` · `fill` |

Tokens: `bg-o500` (switch, chips, Override tag, unsaved dot), `border-o500` (an override field), `text-o700` (links, preview prices),
`border-red`/`text-red`/`bg-red-soft` (conflicts, closed with orders, Sold out), `bg-green-soft`/`text-green` (Open, saved), `bg-sunken`,
`shadow-raised` (strip, save bar), `rounded-panel/chip/pill`, `pb-safe`, breakpoints `md`, `lg`, `2xl`.

## Props

```ts
AdminCalendarDay { dict: AdminCopy; data: DayEditorData }
DayEditor        { data; dict }
DayHeader        { title; badge: "open" | "closedWithOrders" | "closed"; backHref; prevHref; nextHref; onCopy: (() => void) | null; onLeave(event, href); dict: DayCopy }
ClosedLine       { text }
ItemPicker       { data; editor: DayEditor; dict: AdminCopy }
ItemGroup        { name; items; all; editor; dict: DayCopy["items"] }
ItemRow          { item; plan: ItemPlan; ordered; expanded; onToggle; onExpand; onQuantity; onOverride; onSoldOut; dict }
ItemControls     { item; plan; ordered; onQuantity; onOverride; onSoldOut; dict }
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

- **The list** is every active menu item, plus anything already on the day (an inactive or archived one shows a tag; it can be
  taken off, not added). Search and category chips only narrow the list. Ticking an item opens its controls.
- **Never silently clamp.** A quantity below what's already ordered turns the row red, says "3 already ordered — can’t go below
  3.", and Save stays disabled with the reason in the status line. Sold out sets the quantity to the amount ordered. An item
  with orders can't be unticked (its checkbox is disabled and says why). The server checks again against fresh rows: if
  orders arrived meanwhile it refuses with the new counts, the red lines update and the editor says so.
- **Price override** is per day, typed in rupees; empty or equal to the base price stores nothing. The row shows
  "Override ₹260" and the field "+₹20 vs base ₹240".
- **Closing** a day with orders opens `CloseDayDialog` from the switch; the save then sends `confirmClose`. If the page didn't
  know about the orders, the save is refused with them and the same dialog confirms and saves. Closing never touches orders.
  While closed, the item list and the other settings rest (dimmed, disabled) and a "Why it’s closed" note appears — staff
  only, shown on the week card.
- **Max verified orders** can't pass **Orders to accept** (`overbookLimit`, a database CHECK): raising max past it raises it.
- **Copy from another day** offers the planned days nearest this one (and always the same weekday last week); confirming
  replaces the ticked items and quantities in the form, clears overrides, and keeps ordered items on with at least their
  ordered amount. Nothing is saved until Save day.
- **Leaving** with unsaved changes — Back, ‹, › — asks first; a reload or tab close gets the browser's prompt.
- **Past days** render read-only (one disabled fieldset) with no save bar and no copy.

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` | one column: settings first, then items; title and badge stacked; Copy from another day full width; chips scroll sideways; sticky strip + save bar |
| `md` (768, the 820px kitchen tablet) | settings 2×2; item controls three across; chips wrap; title and badge in a row; Copy beside them |
| `lg` (1024) | items 62% · sticky settings column 38% with the save card; strip and save bar go away |
| `2xl` (1600) | items 45% · settings 30% · customer preview 25% |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component. The 820px tablet matters most.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.calendarDay`, `admin.cutoffs`, `admin.closeDay` |
| A rule (limits, what counts as a change or conflict) | `src/lib/calendar/form.ts` — the save action re-checks with the same limits |
| What saving writes or refuses | `saveDay` in `src/lib/calendar/writes.ts`, `saveInput` in `src/app/actions/calendar.ts` |
| Which days Copy from another day offers | `loadDayEditor` in `src/lib/calendar/day.ts` (`SOURCE_WINDOW`, `SOURCE_COUNT`) |

## Do not

- Clamp a quantity to what's ordered behind the owner's back — show the conflict and block Save.
- Take an item with orders off the day, or close a day with orders without the confirm.
- Trust the browser's ordered counts — `saveDay` re-reads them under the day's row lock.
