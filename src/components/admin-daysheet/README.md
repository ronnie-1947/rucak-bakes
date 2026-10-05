# admin-daysheet

The day sheet at `/admin/daysheet` ([page](<../../app/admin/(shell)/daysheet/page.tsx>)) — imported from `Admin-daysheet.dc.html` and
`Admin-daysheet-print.dc.html` (revised for order ahead, §10R). One fulfilment day as **what to bake** — Notes and allergies, then
**For orders** (per-item totals from verified orders, then **Made to order** lines for items that bake separately), then the day's
**counter-items** — and **who collects when**. It is read standing, from a metre away: bake quantities are 32px on phones and 40px from the tablet up. View state
lives in the URL ([src/lib/daysheet/routes.ts](../../lib/daysheet/routes.ts)), domain code in [src/lib/daysheet/](../../lib/daysheet/).

## Files in this folder

```
admin-daysheet/
  AdminDaySheet.tsx     entry (server) — narrows rows/notes/orders to the view, builds the tick map, composes screen + print
  DaySheetProvider.tsx  "use client" — both ticks: useOptimistic + server actions, the undo line, failures; whether the orders went stale (context: hooks/useDaySheet)
  SheetBar.tsx          sticky: ‹ day ›, Today, DateJump (lg+), Print; the SheetWatcher line rides inside it
  DateJump.tsx          "use client" — native date input → ?date=
  PrintButton.tsx       "use client" — checks the day's orders, refreshes if they changed, then window.print() ("Updating…" meanwhile)
  SheetWatcher.tsx      "use client" — polls checkDaySheet every 15s; other devices' ticks and cancelled / no-show orders refresh, new or verified orders show "refresh to update" and mark the sheet stale
  SheetSummary.tsx      "6 orders · 18 ordered items · 8 counter-items (112 pieces) · first pickup 7:30am · last 12pm", what For orders counts, PendingSwitch
  PendingSwitch.tsx     "use client" — Switch that toggles ?pending=1
  ViewTabs.tsx          Bake | Pickups · n — two links styled as a segmented control
  SheetState.tsx        no live orders: closed in the Calendar / too far ahead / none yet (EmptyState + StateMessage)
  StateMessage.tsx      title + body inside EmptyState's paragraph
  NotesPanel.tsx        "Notes and allergies — read before you start"
  NoteCard.tsx          one customer note; red with an "Allergy" eyebrow when it names one; "Meera Iyer · BK-4821 · 11:30am"
  BakeList.tsx          "For orders": TickProgress (item rows + Made to order lines), a BakeSection per category, MadeSection; or why it's empty
  BakeSection.tsx       one category heading + its rows
  BakeRow.tsx           "use client" — total, name, unit line, note icon, who line ("Meera BK-4821 · Anita BK-4815"), DoneBox (every verified line)
  MadeSection.tsx       "Made to order" heading + its rows
  MadeRow.tsx           "use client" — one line of a bake-separately item: quantity, name, "For Sunita Reddy · BK-4827", the note as a chip
  CounterList.tsx       "Counter-items": TickProgress + CounterRow × n, or "No counter-items today — orders only"
  CounterRow.tsx        "use client" — quantity made, name, unit line, DoneBox ("Mark X baked")
  SheetRow.tsx          the bake row frame the three share: big quantity (+ what's under it), the middle, the tick
  PickupList.tsx        "Collections": TickProgress, column header (lg+), PickupSlotList per slot
  PickupSlotList.tsx    Morning / Afternoon / Any time / Deliveries
  PickupRow.tsx         "use client" — time, name + code link, every line, tel, tags, note, address + Maps, total, DoneBox
  TickProgress.tsx      "use client" — "4 of 9 done", Meter, and the undo line / failure for the kinds of row in that list
  DoneBox.tsx           the 28px tick in a 44px target (role="checkbox")
  PrintSheet.tsx        hidden on screen, the whole printout in print: PrintPageRules, header, PrintStale, PrintNotes, For orders, counter-items, PrintPickups
  PrintStale.tsx        "use client" — the bordered "may be out of date" line, printed only when the sheet is stale (a Ctrl+P skips PrintButton)
  PrintPageRules.tsx    <style> with the @page margin boxes — "continued" header after page 1, "Page X of Y" footer (words from the dict)
  PrintNotes.tsx        the 2px-bordered notes box ("ALLERGY:" first on an allergen note)
  PrintGroup.tsx        one printed group (a category, Made to order, the counter-items), never split across pages, with pen-tick squares
  PrintPickups.tsx      the collections table, rows never split
  copy.ts               pendingText, unitText, counterText, summaryText, pendingLine — dict strings filled
  types.ts              AdminCopy, DaySheetCopy
  README.md
```

## Component tree

```
AdminDaySheet dict=dict.admin data=DaySheetData
└─ DaySheetProvider ticks readOnly=isPast version=orders version
   ├─ div.print:hidden!
   │  ├─ SheetBar → DateJump, PrintButton, SheetWatcher (key = orders version)
   │  └─ Container
   │     ├─ SheetState                          (no live orders)
   │     └─ else: past Notice · closed-with-orders Notice · SheetSummary → PendingSwitch
   │        ├─ red Notice "Nothing is verified yet"   (no verified orders, pending off)
   │        └─ ViewTabs, then
   │           ├─ bake:    NotesPanel → NoteCard × n
   │           │           BakeList → TickProgress, BakeSection × n → BakeRow → SheetRow, DoneBox · MadeSection → MadeRow → SheetRow, DoneBox
   │           │           CounterList → TickProgress, CounterRow × n → SheetRow, DoneBox
   │           └─ pickups: PickupList → TickProgress, PickupSlotList × n → PickupRow → DoneBox
   └─ PrintSheet (hidden print:flex) → PrintPageRules, PrintStale, PrintNotes, PrintGroup × n, PrintPickups
```

Copy: `dict.admin.daysheet` throughout; `dict.admin.orders.items` ("{quantity}× {name}") for order lines.

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/daysheet/queries` | `loadDaySheet` read model, `loadSheetVersion`; `DaySheetData`, `BakeRow`, `MadeRow`, `CounterRow`, `SheetOrder`, `SheetNote`, `SheetVersion` |
| `@/lib/daysheet/routes` | `SheetParams`, `sheetHref` (DateJump) |
| `@/lib/daysheet/tick` | `tickKey`, `TickKind` (`item` · `line` · `counter` · `collect`), `Tick` |
| `@/app/actions/daysheet` | `tickBaked`, `tickCollected`, `checkDaySheet` |
| `@/hooks/useDaySheet` | the provider's context |
| `@/components/ui/*` | `Button`/`buttonClasses`, `ButtonLink`, `Container`, `EmptyState`, `Meter`, `Notice`, `Switch`, `Tag`, `UndoBar`, `Icon`, `CheckIcon` |
| `@/lib/money` · `@/lib/template` · `@/lib/dates` | `formatPaise`, `fill`, `isIsoDate` |

External: `next/link`, `next/navigation`. Tokens: `text-glance` / `text-glance-lg` (the bake totals), `text-print` / `border-print`
(print only), `bg-green-soft`, `text-green`, `bg-red-soft`, `border-red`, `bg-o50`, `border-o200`, `bg-o500` (active tab), `text-o700`,
`shadow-raised` (sticky bar), `rounded-panel`, `rounded-chip`, `rounded-button`, breakpoints `xxs`, `md`, `lg`, `xl`, variant `print`.

## Props

```ts
AdminDaySheet    { dict: AdminCopy; data: DaySheetData }
DaySheetProvider { date; ticks: Record<string, boolean>; readOnly: boolean; version: string; dict: DaySheetCopy; children }
SheetBar         { data; dict }
DateJump         { params: SheetParams; today: string; label: string; className? }
PrintButton      { date; orders: string[]; label; updatingLabel }
SheetWatcher     { date; version: SheetVersion; live: boolean; dict }
SheetSummary     { data; dict }
PendingSwitch    { on; href; label }
ViewTabs         { view: SheetView; hrefs: Record<SheetView, string>; pickupCount; dict }
SheetState       { data; dict }
StateMessage     { title; body }
NotesPanel       { notes: SheetNote[]; dict; className? }
NoteCard         { note; dict }
BakeList         { groups: BakeGroup[]; made: MadeRow[]; showPending; pendingCount; dict }
BakeSection      { title; rows: BakeRow[]; showPending; dict }
BakeRow          { row: BakeRow; showPending; dict }
MadeSection      { rows: MadeRow[]; dict }
MadeRow          { row: MadeRow; dict }
CounterList      { rows: CounterRow[]; dict }
CounterRow       { row: CounterRow; dict }
SheetRow         { done; quantity; below?; children; tick }
PickupList       { orders: SheetOrder[]; dict; itemTemplate }
PickupSlotList   { title; orders; dict; itemTemplate }
PickupRow        { order: SheetOrder; dict; itemTemplate }
TickProgress     { rows: { kind: TickKind; id }[]; template; meterLabel; synced?; dict }
DoneBox          { done; onToggle; label; disabled }
PrintSheet       { data; dict; itemTemplate }
PrintStale       { text }
PrintPageRules   { running; continued; footer; pageTemplate }
PrintNotes       { notes; dict }
PrintGroup       { title; lines: PrintLine[] }
PrintPickups     { orders; dict; itemTemplate }
```

## How it works

- **For orders** — `loadDaySheet` sums order lines per menu item: VERIFIED, READY and COMPLETED into `verified` (the total), PENDING
  into `pending`, kept apart from the first line. Cancelled and no-show orders aren't on the sheet. Rows use the item's current name
  and category (categories in the bakery's order; uncategorised last as "Other"), biggest total first, and name who each is for.
  Items with **Bake each order separately** (`MenuItem.bakeSeparately`) aren't totalled: each of their lines is a **Made to order**
  row with the order's note beside it (red when it names an allergen) — the line's own name, since no custom title exists.
- **Counter-items** — the day's `MenuDayItem` rows (planned in the Calendar, never ordered online), with the quantity made. A day
  with counter-items and no orders still gets a sheet (For orders says so; Pickups says there are none).
- **Include pending** — off by default (`?pending=1`). On, a row shows "+ 3 pending" under its total, pending-only items appear
  with a total of 0, pending notes and orders appear tagged "Pending" — never added to a total, never tickable for collection.
- **Ticks** — a For orders row writes `OrderItem.bakedAt` on every verified line of that item that day (a line verified later starts
  unbaked, so the row un-ticks — the new units still need baking); a Made to order row writes its own line's (pending lines can't be
  ticked); a counter-item writes `MenuDayItem.bakedAt`. Collected moves the order to COMPLETED (`markCollected`: from VERIFIED it passes
  READY at the same instant) and the customer's counters with it; unticking runs `undoCollected`. Both are idempotent, refused on a
  past day, no confirm — the green undo line under the list is the way back. A tap shows at once (`useOptimistic`); the action
  revalidates, so the next render's `ticks` carry it.
- **Other devices** — `SheetWatcher` polls `checkDaySheet(date)` every 15 seconds while the tab is visible (and on returning to it).
  The version has two parts: `ticks` (baked lines and counter-items, collected orders) — a change just refreshes; `orders` (each live order and
  whether it's pending) — orders only leaving the day (cancelled, no-show) just refresh, so nothing is baked for them; a new or newly
  verified order shows "1 new order — refresh to update" instead of growing the list under someone's finger (with an order leaving
  in the same poll, the line covers both).
- **Notes** — every customer note, allergen notes first. `mentionsAllergen` (whole-word list in `src/lib/daysheet/notes.ts`) only
  ever promotes a note to red; a note it misses still shows. A bake row carries the note icon when an order containing it has a note.
- **States** — closed in the Calendar with no orders · beyond `orderAheadDays` · neither orders nor counter-items ("Nothing planned
  for …") · orders but none verified and no counter-items (red, with "Verify in Orders"). A closed day that still has orders shows
  them under a warm line. A past day is read-only. Include pending only appears while there are pending orders on an open day.
- **Print** — `PrintSheet` replaces the screen (`print:hidden!` / `print:flex`; the admin shell hides its frame and lets `main`
  flow). A4 (`@page` in globals.css), black on white, verified orders only whatever the switch says: the summary without times and
  "Printed Sun 4 Oct, 5:02am"; notes ("ALLERGY:" first); For orders with who lines and "(see note)", Made to order with its notes in
  bold; the counter-items; the collections table. Quantities 32px (24pt) semibold, pen-tick squares, `break-inside-avoid` on every
  group and row. `PrintPageRules` adds the "continued" header (not on page 1) and "Page X of Y" through `@page` margin boxes —
  Chromium 131+; other browsers print without them.
- **A printout is never older than the orders** — the watcher catches up only every 15 seconds and only offers a refresh for new and
  newly verified orders, so Print first asks `checkDaySheet`: if an order arrived, was verified, cancelled or marked no-show since, it refreshes and prints
  once the fresh sheet has rendered. Ctrl+P or the browser menu skip that; once the watcher has seen the orders change, the printout
  leads with "Orders for this day changed after this sheet was opened…" (`PrintStale`), cleared by the refresh that brings them in.

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs` (320) | day title at H2 between the arrows; Today and Print on a second row |
| `xxs`–`sm` | title at H1; totals 32px; Notes → For orders → Counter-items in one column (at every width) |
| `md` (768, kitchen tablet) | one bar row; totals 40px; tabs capped at 480px |
| `lg` (1024) | date picker in the bar; column header over the pickups |
| `2xl`+ | Container caps the width |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.daysheet` |
| What counts toward a total | `loadDaySheet` in `src/lib/daysheet/queries.ts` (`VERIFIED_STATUSES`) |
| Allergen words | `src/lib/daysheet/notes.ts` |
| Poll interval / what refreshes silently | `POLL_MS` in `SheetWatcher.tsx`, `versionOf` in `queries.ts` |
| Tick rules (past days, idempotency) | `src/lib/daysheet/ticks.ts`; the order moves in `src/lib/orders/lifecycle.ts` |
| The printout | `PrintSheet.tsx` and its `Print*` parts; page size and margins in `@page` (globals.css) |

## Do not

- Add pending quantities into a For orders total, or count them in "done".
- Total a bake-separately item — its lines are Made to order rows, each with its customer's note.
- Put a confirm dialog on a tick — the undo line is the design.
- Reload the sheet when another device adds an order; show the line and let the person choose when.
- Print the screen layout — print styles belong in `PrintSheet`, not on the screen parts.
