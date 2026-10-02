# admin-menu

The menu library at `/admin/menu` ([page](<../../app/admin/(shell)/menu/page.tsx>)) — imported from `Admin-Menu.dc.html`.
Everything the bakery can make: search, category and status chips, sort, list / grid, an inline Active switch, bulk select,
and the archived view. What's on sale on a given day belongs to the Calendar — the line under the title says so, because
without it the owner reads the Active switch as "on sale today". View state lives in the URL ([src/lib/menu/filters.ts](../../lib/menu/filters.ts)).

## Files in this folder

```
admin-menu/
  AdminMenu.tsx            entry (server) — header, filter bar, provider, then archived list | empty state | board; FAB
  MenuHeader.tsx           h1 + counts, Archived (n) / Back to menu, Select / Done, Add item (md+), the Calendar line
  MenuFilterBar.tsx        sticky: SearchBox (ui) + ViewToggle, then category chips · status chips · SortSelect
  ViewToggle.tsx           List / Grid segmented links; with no ?view= the bar renders one per breakpoint
  SortSelect.tsx           "use client" — native select swapping ?sort=
  MenuBoard.tsx            "use client" — rows / grid / table by view; bulk selection; BulkBar
  MenuRow.tsx              "use client" — list view below 1024px
  MenuCard.tsx             "use client" — grid card (4:3 cover, footer with switch and ⋯ opening upward)
  MenuTable.tsx            list view from 1024px — table shell, header widths
  MenuTableRow.tsx         "use client" — one table row; the name links to the item
  ItemThumb.tsx            56px photo square, picture glyph when none, photo-count pill
  ItemCover.tsx            the card's 4:3 cover — photo or "No photo", Inactive and "3 photos" markers
  ItemSwitch.tsx           "use client" — Switch (ui) wired to activate / deactivate
  ItemMenu.tsx             "use client" — ⋯ menu: Edit, Duplicate, Archive (red)
  BulkBar.tsx              "use client" — sticky bottom: N selected · Activate · Deactivate · Archive
  RestoreButton.tsx        "use client" — the archived view's Restore
  ArchivedList.tsx         ?archived=1 — rows with "Archived Mon 12 Jan · 31 past orders still reference it"
  AddFab.tsx               phones: the round Add item button, sticky 16px above the tab bar
  copy.ts                  usageText, archivedMeta — dict strings filled (priceText is in src/lib/menu/copy.ts)
  types.ts                 AdminCopy, MenuCopy, PriceUnitCopy, ViewMode
  README.md
```

## Component tree

```
AdminMenu dict=dict.admin library filters
├─ MenuHeader                              .title/.archivedTitle · .count · .archivedLink · .select/.done · .add · .explain
├─ MenuFilterBar (not archived, items > 0) .searchLabel · .views · .allCategories · .statuses · .sorts
│  ├─ SearchBox (ui) + ViewToggle × 1–2
│  └─ ChipLink × categories | ChipLink × statuses | SortSelect
├─ MenuActionsProvider (src/components/menu-actions) — undo strip, dialogs
│  ├─ ArchivedList > ItemThumb, RestoreButton
│  │  or EmptyState (.emptyAll + Add your first item | .emptySearch/.emptyFilters + Clear filters)
│  │  or MenuBoard
│  │     ├─ MenuRow × n   → ItemThumb, ItemMenu, ItemSwitch, SelectBox (ui)
│  │     ├─ MenuCard × n  → ItemCover, ItemMenu (up), ItemSwitch, SelectBox (ui)
│  │     ├─ MenuTable > MenuTableRow × n
│  │     └─ BulkBar (select mode)
└─ AddFab (phones, not select / archived)
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/menu/queries` | `loadMenuLibrary` → `MenuLibrary`, `MenuItemRow`, `ArchivedItemRow`, `ScheduledDay` |
| `@/lib/menu/filters` | parse / build view URLs (`menuHref`), `isFiltered`, `CLEARED` |
| `@/app/actions/menu` | `setMenuItemsActive`, `archiveMenuItems`, `restoreMenuItem`, `duplicateMenuItem`, `undoMenuChange` |
| `@/components/menu-actions/MenuActionsProvider` | every change: confirms, server actions, the undo strip |
| `@/lib/menu/copy` | `priceText` |
| `@/hooks/useMenuActions` | context: `request(kind, targets, onDone?)`, `pending`; `ItemTarget` |
| `@/hooks/useDismiss` | ⋯ menu closes on outside press / Escape |
| `@/components/ui/*` | `Button`/`buttonClasses`, `ButtonLink`, `Checkbox`, `ChipLink`, `Container`, `Dialog`, `EmptyState`, `Notice`, `SearchBox`, `SelectBox`, `Switch`, `Tag`, `Icon`, `CheckIcon`, `CloseIcon` |
| `@/lib/cloudinary` · `@/lib/money` · `@/lib/template` | `imageUrl`, `formatPaise`, `fill` |

External: `next/image` (Cloudinary URLs, `unoptimized` — Cloudinary already sizes and compresses), `next/link`, `next/navigation`.
Tokens: `bg-o500` (switch, pressed chips/segments), `text-o700`, `bg-o50` (selected row), `border-o700` (selected card), `bg-green-soft`/
`text-green` (undo strip, Active), `text-red` (Archive), `bg-sunken`, `shadow-raised`, `rounded-panel/chip/pill`, `text-h1`, `text-small-admin`,
`text-micro`, `pb-safe`, breakpoints `xxs`, `md`, `lg`, `xl`, `2xl`.

## Props

```ts
AdminMenu           { dict: AdminCopy; library: MenuLibrary; filters: MenuFilters }
MenuHeader          { dict: MenuCopy; filters; totalCount; activeCount; archivedCount }
MenuFilterBar       { dict; filters; view: ViewMode; categories: { slug; name }[] }
ViewToggle          { filters; current: "list" | "grid"; dict; className }   // className sets the display
SortSelect          { value; options: { value; label; href }[]; label; className? }
MenuBoard           { dict: AdminCopy; items: MenuItemRow[]; view: ViewMode; selectMode; exitSelectHref }
MenuRow / MenuCard / MenuTableRow { item; dict: AdminCopy; selectMode; checked; onToggle }
MenuTable           { dict; selectMode; children }
ItemThumb           { images; muted }
ItemCover           { images; isActive; dict }
ItemSwitch          { item; dict; className? }
ItemMenu            { item; dict; direction?: "down" | "up" }
BulkBar             { dict; selectedCount; activatable; deactivatable; pending; onActivate; onDeactivate; onArchive }
RestoreButton       { id; name; dict }
ArchivedList        { items: ArchivedItemRow[]; dict }
AddFab              { label }
```

## How it works

- **Data** — `loadMenuLibrary(filters)` reads every non-archived item once (a bakery's menu is a few dozen) and searches (name or
  any ingredient), filters and sorts in memory. "This week" = open days today … today+6 carrying the item; "ordered this month" =
  units on this calendar month's orders, cancelled and no-show left out. Archived rows are only read for `?archived=1`.
- **View** — `?view=list|grid`; unset is `auto`: rows below 768px, grid from 768px. Explicit list = rows below 1024px, table
  from 1024px. Every layout a view uses is rendered and swapped by CSS — no resize logic.
- **Changes** — rows, cards, the ⋯ menu and the bulk bar call `useMenuActions().request()`. Archive always confirms;
  deactivate confirms only when an item is on an upcoming day. Activate, restore and duplicate run straight away.
- **Undo** — every action returns a `MenuSnapshot` of what it overwrote (item flags, removed day rows); the strip's Undo sends
  it to `undoMenuChange`, which puts it back (day rows only on days that haven't passed). Undoing a duplicate archives the copy.
- **Remove from days** — deactivate (when ticked) and archive delete `MenuDayItem` rows on today-or-later days **with nothing
  ordered**. A day that already has orders keeps the item, so those orders still bake; the dialogs say so.
- **Duplicate** — "Name (copy)", inactive, on no day, photos shared (`deleteImage` refuses while any item uses one).
- **Edit / Add** open the item form at `/admin/menu/[id]` and `/admin/menu/new` (`src/components/admin-menu-item`).

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs` | grid view (if chosen) is one column; chip row scrolls sideways; FAB above the tab bar |
| `xxs` (375) | grid view two columns |
| `md` (768, kitchen tablet) | default view becomes the grid, three columns; search stops at 320px; chips wrap; Add item button replaces the FAB |
| `lg` (1024) | explicit list view becomes the table |
| `xl` (1280) | grid four columns |
| `2xl` (1600) | grid five columns; `Container` caps the width |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.menu`, `admin.priceUnits` |
| A filter or sort | `src/lib/menu/filters.ts` (parse + href), `loadMenuLibrary` in `src/lib/menu/queries.ts`, a chip here |
| What a change does | `src/lib/menu/changes.ts` (returns the snapshot Undo needs), the action in `src/app/actions/menu.ts` |
| Table columns | `MenuTable.tsx` (header + width) and `MenuTableRow.tsx` (cell) together |

## Do not

- Delete a menu item — archive it (non-negotiable 7).
- Take an item off a day that already has orders for it.
- Add a change that doesn't return a snapshot — Undo depends on it.
- Build view URLs by hand — use `menuHref`.
