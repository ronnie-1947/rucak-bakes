# admin-daysheet

The day sheet at `/admin/daysheet` ([page](<../../app/admin/(shell)/daysheet/page.tsx>)) — imported from `Admin-daysheet.dc.html` and
`Admin-daysheet-print.dc.html`. One fulfilment day's orders as **what to bake** (per-item totals, verified orders only) and **who
collects when**. It is read standing, from a metre away: bake quantities are 32px on phones and 40px from the tablet up. View state
lives in the URL ([src/lib/daysheet/routes.ts](../../lib/daysheet/routes.ts)), domain code in [src/lib/daysheet/](../../lib/daysheet/).

## Files in this folder

```
admin-daysheet/
  AdminDaySheet.tsx     entry (server) — narrows rows/notes/orders to the view, builds the tick map, composes screen + print
  DaySheetProvider.tsx  "use client" — both ticks: useOptimistic + server actions, the undo line, failures (context: hooks/useDaySheet)
  SheetBar.tsx          sticky: ‹ day ›, Today, DateJump (lg+), Print; the SheetWatcher line rides inside it
  DateJump.tsx          "use client" — native date input → ?date=
  PrintButton.tsx       "use client" — window.print()
  SheetWatcher.tsx      "use client" — polls checkDaySheet every 15s; other devices' ticks refresh, order changes show "refresh to update"
  SheetSummary.tsx      "3 orders · 8 items · first pickup 08:00 · last pickup 10:30", what the totals count, PendingSwitch
  PendingSwitch.tsx     "use client" — Switch that toggles ?pending=1
  ViewTabs.tsx          Bake | Pickups · n — two links styled as a segmented control
  SheetState.tsx        no live orders: closed in the Calendar / too far ahead / none yet (EmptyState + StateMessage)
  StateMessage.tsx      title + body inside EmptyState's paragraph
  NotesPanel.tsx        "Notes and allergies — read before you start"
  NoteCard.tsx          one customer note; red with "Allergen" when it names one
  BakeList.tsx          "What to bake": TickProgress + a BakeSection per category
  BakeSection.tsx       one category heading + its rows
  BakeRow.tsx           "use client" — total (text-glance), name, unit line, note icon, DoneBox
  PickupList.tsx        "Collections": TickProgress, column header (lg+), PickupSlotList per slot
  PickupSlotList.tsx    Morning / Afternoon / Any time / Deliveries
  PickupRow.tsx         "use client" — time, name + code link, every line, tel, tags, note, address + Maps, total, DoneBox
  TickProgress.tsx      "use client" — "4 of 9 batches done", Meter, and the undo line / failure for that list
  DoneBox.tsx           the 28px tick in a 44px target (role="checkbox")
  PrintSheet.tsx        hidden on screen, the whole printout in print: header, PrintNotes, PrintBakeSection × n, PrintPickups
  PrintNotes.tsx        the 2px-bordered notes box
  PrintBakeSection.tsx  one category, never split across pages, with pen-tick squares
  PrintPickups.tsx      the collections table, rows never split
  copy.ts               pendingText, unitText, summaryText — dict strings filled
  types.ts              AdminCopy, DaySheetCopy
  README.md
```

## Component tree

```
AdminDaySheet dict=dict.admin data=DaySheetData
└─ DaySheetProvider ticks readOnly=isPast
   ├─ div.print:hidden!
   │  ├─ SheetBar → DateJump, PrintButton, SheetWatcher (key = orders version)
   │  └─ Container
   │     ├─ SheetState                          (no live orders)
   │     └─ else: past Notice · closed-with-orders Notice · SheetSummary → PendingSwitch
   │        ├─ red Notice "Nothing is verified yet"   (no verified orders, pending off)
   │        └─ ViewTabs, then
   │           ├─ bake:    NotesPanel → NoteCard × n  +  BakeList → TickProgress, BakeSection × n → BakeRow → DoneBox
   │           └─ pickups: PickupList → TickProgress, PickupSlotList × n → PickupRow → DoneBox
   └─ PrintSheet (hidden print:flex) → PrintNotes, PrintBakeSection × n, PrintPickups
```

Copy: `dict.admin.daysheet` throughout; `dict.admin.orders.items` ("{quantity}× {name}") for order lines.

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/daysheet/queries` | `loadDaySheet` read model, `loadSheetVersion`; `DaySheetData`, `BakeRow`, `SheetOrder`, `SheetNote`, `SheetVersion` |
| `@/lib/daysheet/routes` | `SheetParams`, `sheetHref` (DateJump) |
| `@/lib/daysheet/tick` | `tickKey`, `TickKind`, `Tick` |
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
DaySheetProvider { ticks: Record<string, boolean>; readOnly: boolean; dict: DaySheetCopy; children }
SheetBar         { data; dict }
DateJump         { params: SheetParams; today: string; label: string; className? }
PrintButton      { label }
SheetWatcher     { date; version: SheetVersion; live: boolean; dict }
SheetSummary     { data; dict }
PendingSwitch    { on; href; label }
ViewTabs         { view: SheetView; hrefs: Record<SheetView, string>; pickupCount; dict }
SheetState       { data; dict }
StateMessage     { title; body }
NotesPanel       { notes: SheetNote[]; dict; className? }
NoteCard         { note; dict }
BakeList         { groups: BakeGroup[]; showPending; dict; className? }
BakeSection      { title; rows: BakeRow[]; showPending; dict }
BakeRow          { row: BakeRow; showPending; dict }
PickupList       { orders: SheetOrder[]; dict; itemTemplate }
PickupSlotList   { title; orders; dict; itemTemplate }
PickupRow        { order: SheetOrder; dict; itemTemplate }
TickProgress     { kind: TickKind; ids: string[]; template; meterLabel; dict }
DoneBox          { done; onToggle; label; disabled }
PrintSheet       { data; dict; itemTemplate }
PrintNotes       { notes; dict }
PrintBakeSection { title; rows; dict }
PrintPickups     { orders; dict; itemTemplate }
```

## How it works

- **Totals** — `loadDaySheet` sums order lines per menu item: VERIFIED, READY and COMPLETED into `verified` (the bake total), PENDING
  into `pending`, kept apart from the first line. Cancelled and no-show orders aren't on the sheet. Rows use the item's current name
  and category (categories in the bakery's order; uncategorised last as "Other"), biggest total first.
- **Include pending** — off by default (`?pending=1`). On, a row shows "+ 3 pending" under its total, pending-only items appear
  with a total of 0, pending notes and orders appear tagged "Pending" — never added to a total, never tickable for collection.
- **Ticks** — Baked writes `MenuDayItem.bakedAt`; Collected moves the order to COMPLETED (`markCollected`: from VERIFIED it passes
  READY at the same instant) and the customer's counters with it; unticking runs `undoCollected`. Both are idempotent, refused on a
  past day, no confirm — the green undo line under the list is the way back. A tap shows at once (`useOptimistic`); the action
  revalidates, so the next render's `ticks` carry it.
- **Other devices** — `SheetWatcher` polls `checkDaySheet(date)` every 15 seconds while the tab is visible (and on returning to it).
  The version has two parts: `ticks` (baked items, collected orders) — a change just refreshes; `orders` (each live order and
  whether it's pending) — a change shows "1 new order — refresh to update" instead of reshuffling the list under someone's finger.
- **Notes** — every customer note, allergen notes first. `mentionsAllergen` (whole-word list in `src/lib/daysheet/notes.ts`) only
  ever promotes a note to red; a note it misses still shows. A bake row carries the note icon when an order containing it has a note.
- **States** — closed in the Calendar with no orders · beyond `orderAheadDays` · no orders · orders but none verified (red, with
  "Verify in Orders"). A closed day that still has orders shows them under a warm line. A past day is read-only.
- **Print** — `PrintSheet` replaces the screen (`print:hidden!` / `print:flex`; the admin shell hides its frame and lets `main`
  flow). A4 (`@page` in globals.css), black on white, verified orders only whatever the switch says, quantities 32px (24pt)
  semibold, pen-tick squares, notes in a 2px box, `break-inside-avoid` on every category and table row. "As of" is when the page
  was read.

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs` (320) | day title at H2 between the arrows; Today and Print on a second row |
| `xxs`–`sm` | title at H1; totals 32px; notes above the bake list |
| `md` (768, kitchen tablet) | one bar row; totals 40px; tabs capped at 480px |
| `lg` (1024) | date picker in the bar; column header over the pickups |
| `xl` (1280) | notes beside the bake list (bake 3fr · notes 2fr) |
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

- Add pending quantities into a bake total, or count them in "batches done".
- Put a confirm dialog on a tick — the undo line is the design.
- Reload the sheet when another device adds an order; show the line and let the person choose when.
- Print the screen layout — print styles belong in `PrintSheet`, not on the screen parts.
