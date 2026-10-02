# admin-calendar

The week planner at `/admin/calendar` ([page](<../../app/admin/(shell)/calendar/page.tsx>)) — screen A of
`Admin Calander & Calander date.dc.html`. Seven day cards, Monday to Sunday: what's on sale, when orders close,
max orders against verified orders, and the Open switch. **Never a month grid** — it can't carry per-day item counts
and capacity bars. Each day is edited in full by the day editor (`src/components/admin-calendar-day`). Data:
[src/lib/calendar/week.ts](../../lib/calendar/week.ts); writes: [src/lib/calendar/writes.ts](../../lib/calendar/writes.ts).

## Files in this folder

```
admin-calendar/
  AdminCalendar.tsx     entry (server) — Container > WeekPlanner (keyed by week) with WeekNav as its nav slot
  WeekNav.tsx           ‹ range › links + This week; the week's numbers ("6 open days · 38 items scheduled · …")
  WeekPlanner.tsx       "use client" — title + WeekActions, nav, Past week tag, FlashLine, ApplyPanel, EmptyWeek | day grid, CopyWeekDialog
  WeekActions.tsx       Copy last week + Apply to all days — beside the title from 768px, stacked under the nav on phones
  ApplyPanel.tsx        "use client" — one Orders close + Max orders for every open day left; names the days and who keeps a higher max
  CopyWeekDialog.tsx    "use client" — "Copy last week?": the two ticks, Will change / Skipped lists, Copy into n days
  CopyRowList.tsx       a titled day list in that dialog ("Mon 5 · Replaces 6 items with 7 items")
  FlashLine.tsx         the green line Copy / Apply leave behind, with Dismiss
  EmptyWeek.tsx         nothing planned this week: Copy last week · Plan Monday
  DayCard.tsx           "use client" — one day: header, then past line | open body | closed body; the close confirm
  DayCardHeader.tsx     weekday, date, Today tag, Open switch (not on past days)
  DayItemsSummary.tsx   count + first three names (narrow cards) / every name (the 1280px columns)
  DayCardOpen.tsx       items, Orders close select, Max orders stepper, capacity Meter + "7 verified · 2 pending", Edit day
  DayCardClosed.tsx     "Closed" + reason tag; red block when orders exist, with View orders
  useDayPatch.ts        a card's live values: saves on change (max after 500ms), reverts on failure, opens the close confirm
  copy.ts               summaryText, namesPreview, pastLine, cutoffSelectOptions, changeText, skipText, itemsText
  types.ts              AdminCopy, CalendarCopy
  README.md
```

## Component tree

```
AdminCalendar dict=dict.admin week
└─ WeekPlanner nav=<WeekNav/>                  .calendar.*
   ├─ WeekActions × 2 (wide md+, narrow <md)
   ├─ Tag "Past week · read only" · FlashLine · ApplyPanel > SelectField, Stepper (ui)
   ├─ EmptyWeek | ol > DayCard × 7
   │                   ├─ DayCardHeader > Switch, Tag (ui)
   │                   ├─ DayCardOpen > DayItemsSummary, SelectField, Stepper, Meter, ButtonLink (ui)
   │                   ├─ DayCardClosed > Tag (ui)
   │                   └─ CloseDayDialog (src/components/close-day-dialog)      .closeDay.*
   └─ CopyWeekDialog > Checkbox × 2, CopyRowList × 2
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/calendar/week` | `loadWeek` → `WeekPlan`, `WeekDay`, `DayOrder` |
| `@/lib/calendar/cutoffs` | `CutoffChoice`, `cutoffKey`/`parseCutoffKey` (select values), `cutoffLabel`, `cutoffOptions` |
| `@/lib/calendar/copy-plan` | `CopyRow` / `CopyChange` / `CopySkip` — the copy dialog's rows, computed by the same `planWeekCopy` the write uses |
| `@/lib/calendar/routes` | `dayHref`, `dayOrdersHref` (week links are built in `loadWeek`) |
| `@/app/actions/calendar` | `updateDay`, `applyToAllDays`, `copyLastWeek` |
| `@/components/close-day-dialog/CloseDayDialog` | the confirm that names a day's orders |
| `@/components/ui/*` | `Button`/`buttonClasses`, `ButtonLink`, `Checkbox`, `Container`, `Dialog`, `Meter`, `SelectField`, `Stepper`, `Switch`, `Tag`, icons |

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
FlashLine       { text; dismissLabel; onDismiss }
EmptyWeek       { firstDay; onCopy; dict }
DayCard         { day: WeekDay; dict: AdminCopy }
DayCardHeader   { day; isOpen; onToggle; dict }
DayItemsSummary { items: string[]; dict }
DayCardOpen     { day; cutoff; maxOrders; onCutoff; onMaxOrders; dict: AdminCopy }
DayCardClosed   { day; dict }
```

## How it works

- **The week** lives in `?week=<Monday>`; bare is this week. The planner reaches 4 weeks back (read-only history) and 6 ahead
  (`WEEKS_BACK` / `WEEKS_AHEAD` in `src/lib/calendar/routes.ts`). Past days are a single read-only line; a week wholly past
  hides Copy and Apply.
- **Unplanned days** (no `MenuDay` row) show as open with the bakery's defaults and no items — customers can't order them
  either way. Any change to one creates its row from the defaults; nothing else does.
- **Card controls save as they change** (`updateDay`): the switch and the cutoff at once, Max orders 500ms after the last tap
  (and on leaving the week). Changing the cutoff recomputes `cutoffAt` for that day. Raising max past the overbook limit
  raises the limit with it (a database CHECK).
- **Closing a day with orders** opens `CloseDayDialog` naming them by code and name. The server refuses a close it wasn't
  told was confirmed, returning the fresh list — so orders that arrived after the page loaded still get named. Closing never
  touches the orders; a closed card with orders keeps a red line and View orders.
- **Copy last week** (`copyWeek`): each day takes the same weekday a week earlier — open/closed, cutoff (recomputed, never
  copied), max and overbook, and its active items, each starting with nothing ordered or baked. Quantities copy when ticked
  (otherwise each item's default quantity); price overrides only when ticked. Skipped, and named in the dialog: past days,
  days with live orders, days whose source was never planned. Day notes stay with their own day.
- **Apply to all days**: one cutoff + max on every open day from today to Sunday; a day keeps a higher max when it already has
  more verified orders (the panel names those days).

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` | one column of cards; header row with the switch at the right; Orders close beside its label (wraps at 320px); Copy last week full width |
| `md` (768, the 820px kitchen tablet) | two columns, Sunday spans both; Orders close above its select; Copy / Apply beside the title |
| `xl` (1280) | seven narrow columns, 8px gaps and padding; titles and switches stacked; every item named; controls full width |
| `2xl`+ | `Container` caps the width |

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
