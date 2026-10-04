# admin-calendar

The week planner at `/admin/calendar` ([page](<../../app/admin/(shell)/calendar/page.tsx>)) — screen A of
`Admin Calander & Calander date.dc.html` (revised for order ahead, §10R). Seven day cards, Monday to Sunday: the day's
orders against max (with the first three customers), when orders close, Max orders, the Open switch, and its
**counter-items** — what's baked for the counter, never ordered online. **Never a month grid** — it can't carry each
day's orders and counter-items. Each day is edited in full by the day editor (`src/components/admin-calendar-day`). Data:
[src/lib/calendar/week.ts](../../lib/calendar/week.ts); writes: [src/lib/calendar/writes.ts](../../lib/calendar/writes.ts).

## Files in this folder

```
admin-calendar/
  AdminCalendar.tsx     entry (server) — Container > WeekPlanner (keyed by week) with WeekNav as its nav slot
  WeekNav.tsx           ‹ range › links + This week; the week's numbers ("6 open days · 23 orders · counter-items on 4 days")
  WeekPlanner.tsx       "use client" — title + WeekActions, nav, Past week tag, UndoBar (ui, no undo), ApplyPanel, EmptyWeek | day grid, CopyWeekDialog
  WeekActions.tsx       Copy last week + Apply to all days — beside the title from 768px, stacked under the nav on phones
  ApplyPanel.tsx        "use client" — one Orders close + Max orders for every open day left; names the days and who keeps a higher max
  CopyWeekDialog.tsx    "use client" — "Copy last week?": "Copy counter-item quantities", Will change / Skipped lists, Copy into n days
  CopyRowList.tsx       a titled day list in that dialog ("Mon 5 · Replaces 3 counter-items → open, 4 counter-items")
  EmptyWeek.tsx         nothing planned this week: Copy last week · Plan Monday
  DayCard.tsx           "use client" — one day: header, then past line | open body | closed body; the close confirm
  DayCardHeader.tsx     weekday, date, Today tag, Open switch (not on past days)
  DayCardOpen.tsx       DayOrders, Orders close select, Max orders stepper (1–30), DayCounter
  DayOrders.tsx         "Orders 4 / 10", Meter, "3 verified · 1 pending", up to three "● Meera · Sourdough loaf ×2" rows in one link
  DayCounter.tsx        at the card's foot: "Butter croissant ×24 · …" (narrow: "5 counter-items · …, +3"), + Add / Edit counter-items
  DayCardClosed.tsx     "Closed" + reason tag; red "3 orders on this day — Ravi, Kavya, Farhan" + View orders when orders exist
  useDayPatch.ts        a card's live values: saves on change (max after 500ms), reverts on failure, opens the close confirm
  copy.ts               summaryText, counterLine, counterShort, mainItemText, pastLine, cutoffSelectOptions, changeText, skipText, itemsText
  types.ts              AdminCopy, CalendarCopy
  README.md
```

## Component tree

```
AdminCalendar dict=dict.admin week
└─ WeekPlanner nav=<WeekNav/>                  .calendar.*
   ├─ WeekActions × 2 (wide md+, narrow <md)
   ├─ Tag "Past week · read only" · UndoBar (the green line Copy / Apply leave) · ApplyPanel > SelectField, Stepper (ui)
   ├─ EmptyWeek | ol > DayCard × 7
   │                   ├─ DayCardHeader > Switch, Tag (ui)
   │                   ├─ DayCardOpen > DayOrders > Meter (ui) · SelectField, Stepper (ui) · DayCounter > ButtonLink (ui)
   │                   ├─ DayCardClosed > Tag (ui)
   │                   └─ CloseDayDialog (src/components/close-day-dialog)      .closeDay.*
   └─ CopyWeekDialog > Checkbox, CopyRowList × 2
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/calendar/week` | `loadWeek` → `WeekPlan`, `WeekDay`, `WeekOrder`, `CounterItem`, `DayOrder` |
| `@/lib/calendar/cutoffs` | `CutoffChoice`, `cutoffKey`/`parseCutoffKey` (select values), `cutoffLabel`, `cutoffOptions` |
| `@/lib/calendar/copy-plan` | `CopyRow` / `CopyChange` / `CopySkip` — the copy dialog's rows, computed by the same `planWeekCopy` the write uses |
| `@/lib/calendar/routes` | `dayHref`, `dayOrdersHref` (week links are built in `loadWeek`) |
| `@/app/actions/calendar` | `updateDay`, `applyToAllDays`, `copyLastWeek` |
| `@/components/close-day-dialog/CloseDayDialog` | the confirm that names a day's orders |
| `@/components/ui/*` | `Button`/`buttonClasses`, `ButtonLink`, `Checkbox`, `Container`, `Dialog`, `Meter`, `SelectField`, `Stepper`, `Switch`, `Tag`, `UndoBar`, icons |

Tokens: `bg-o500` (switch, meter), `text-o700`, `bg-o50`/`border-o200` (Today), `bg-green-soft`/`text-green` (flash, open, a 70%+ day),
`border-red`/`bg-red-soft`/`text-red` (full, orders on a closed day, keeps), `bg-sunken` (empty week), `rounded-panel/chip`, `text-h1/h2`,
`text-small-admin`, `text-micro`, breakpoints `md`, `xl`.

## Props

```ts
AdminCalendar   { dict: AdminCopy; week: WeekPlan }
WeekNav         { week; dict: CalendarCopy }
WeekPlanner     { week; nav: ReactNode; dict: AdminCopy }
WeekActions     { layout: "wide" | "narrow"; applyOpen; onCopy; onApply; dict }
ApplyPanel      { week; dict: AdminCopy; onClose; onDone(text) }
CopyWeekDialog  { week; dict; onClose; onDone(text) }
CopyRowList     { title; rows: { date; label; text }[]; empty?; muted? }
EmptyWeek       { firstDay; onCopy; dict }
DayCard         { day: WeekDay; dict: AdminCopy }
DayCardHeader   { day; isOpen; onToggle; dict }
DayCardOpen     { day; cutoff; maxOrders; onCutoff; onMaxOrders; dict: AdminCopy }
DayOrders       { day; maxOrders; dict }
DayCounter      { day; dict }
DayCardClosed   { day; dict }
```

## How it works

- **The week** lives in `?week=<Monday>`; bare is this week. The planner reaches 4 weeks back (read-only history) and 6 ahead
  (`WEEKS_BACK` / `WEEKS_AHEAD` in `src/lib/calendar/routes.ts`). Past days are a single read-only line; a week wholly past
  hides Copy and Apply.
- **Unplanned days** (no `MenuDay` row) show the bakery's defaults — open unless the opening hours close that weekday — with no
  counter-items. Customers can order ahead for them (placeOrder creates the row from the same defaults); any change here does too.
- **A card (§10R)** — Orders "4 / 10" counts every live order against max (red at max, green from 70%), "3 verified · 1 pending",
  and names up to three by pickup time — a status dot (titled Verified / Pending), the customer and their biggest line — as one
  link into the day editor ("Open Saturday — 6 orders"). Counter-items sit at the foot, the way into the editor ("+ Add
  counter-items" in the accent when there are none). Past: "6 orders · 4 counter-items" or "Closed".
- **Card controls save as they change** (`updateDay`): the switch and the cutoff at once, Max orders 500ms after the last tap
  (and on leaving the week). Changing the cutoff recomputes `cutoffAt` for that day. Raising max past the overbook limit
  raises the limit with it (a database CHECK).
- **Closing a day with orders** opens `CloseDayDialog` naming them by code and name. The server refuses a close it wasn't
  told was confirmed, returning the fresh list — so orders that arrived after the page loaded still get named. Closing never
  touches the orders; a closed card with orders keeps a red line and View orders.
- **Copy last week** (`copyWeek`): each day takes the same weekday a week earlier — open/closed and its reason, cutoff
  (recomputed, never copied), max and overbook, and its active counter-items, none baked. Quantities copy when "Copy
  counter-item quantities" is ticked (otherwise each item's usual counter batch); price overrides and sold-out marks never do.
  Skipped, and named in the dialog: past days, days with live orders, days whose source was never planned. Day notes stay
  with their own day. Rows read "Replaces 3 counter-items → open, 4 counter-items", "No counter-items → open, orders only",
  "Closed → closed".
- **Apply to all days**: one cutoff + max on every open day from today to Sunday; a day keeps a higher max when it already has
  more verified orders (the panel names those days).

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` | one column of cards; header row with the switch at the right; Orders close beside its label (wraps at 320px); Copy last week full width |
| `md` (768, the 820px kitchen tablet) | two columns, Sunday spans both; Orders close above its select; Copy / Apply beside the title |
| `xl` (1280) | four narrow cards across; titles and switches stacked; counter-items as "5 counter-items · …"; controls full width |
| `2xl` (1600)+ | five across; `Container` caps the width |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component. The 820px tablet matters most.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.calendar`, `admin.cutoffs`, `admin.closeDay` |
| Cutoff choices | `CUTOFF_CHOICES` in `src/lib/calendar/cutoffs.ts` (a day saved with another keeps it as an extra option) |
| What Copy last week copies or skips | `planWeekCopy` (`src/lib/calendar/copy-plan.ts`) — the dialog and the write both use it — then `copyWeek` |
| How far the planner reaches | `WEEKS_BACK` / `WEEKS_AHEAD` in `src/lib/calendar/routes.ts` |

## Do not

- Copy `cutoffAt` — always recompute it from the time, days before and the new date.
- Change a day that has orders through Copy last week, or close one without the confirm.
- Delete a `MenuDay` — orders point at it.
