# menu-actions

Every change to menu items outside the item form's own Save — activate, deactivate, archive, restore, duplicate — with
their confirm dialogs and the green undo strip each change leaves behind. Used by the menu list ([admin-menu](../admin-menu/README.md))
and the item form ([admin-menu-item](../admin-menu-item/README.md)), the same way `order-actions/` serves the orders screens.

## Files in this folder

```
menu-actions/
  MenuActionsProvider.tsx  "use client" — runs the server actions, owns the dialogs and the undo state; the useMenuActions() context
  MenuActionsStatus.tsx    "use client" — the failure notice + UndoBar (ui), wherever a screen places them
  DeactivateDialog.tsx     "use client" — names the upcoming days; "Also remove it from these days" (ticked)
  ArchiveDialog.tsx        "use client" — soft archive confirm naming the days it comes off
  ScheduleLines.tsx        a dialog's item list: name, then its upcoming days ("Sat 3 Oct (today) · 4 ordered")
  types.ts                 MenuCopy
  README.md
```

## Component tree

```
MenuActionsProvider dict=dict.admin.menu statusPlacement="top" | "manual"
├─ MenuActionsStatus (when "top")        .failed · .undo · .dismiss · .openCopy · .changed.*
├─ children  → useMenuActions().request(kind, targets, onDone?) · <MenuActionsStatus/> (when "manual")
└─ DeactivateDialog | ArchiveDialog > ScheduleLines   .dialogs.*
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/app/actions/menu` | `setMenuItemsActive`, `archiveMenuItems`, `restoreMenuItem`, `duplicateMenuItem`, `undoMenuChange` |
| `@/hooks/useMenuActions` | the context, `ItemTarget`, `MenuActionKind`, `UndoLine` |
| `@/lib/menu/copy` | `daysText`, `targetsLabel` |
| `@/lib/menu/changes` | `MenuSnapshot` (type) — what Undo sends back |
| `@/components/ui/*` | `Button`, `Checkbox`, `Dialog`, `Notice`, `CheckIcon`, `CloseIcon` |

Tokens: `bg-green-soft`, `text-green`, `text-o700`, `text-red`, `border-border`.

## Props

```ts
MenuActionsProvider { dict: MenuCopy; statusPlacement?: "top" | "manual"; children }
MenuActionsStatus   { dict }
DeactivateDialog    { targets: ItemTarget[]; dict; pending; onClose; onConfirm(removeFromDays) }
ArchiveDialog       { targets; dict; pending; onClose; onConfirm }
ScheduleLines       { targets; dict: MenuCopy["dialogs"] }
```

## How it works

- `request(kind, targets, onDone?)` — archive always confirms; deactivate confirms when any target is on an upcoming day;
  activate, restore and duplicate run straight away. `onDone` runs after the change lands (leave select mode, …).
- Each server action returns a `MenuSnapshot` of what it overwrote; Undo sends it to `undoMenuChange`. A duplicate also
  returns the copy's id, and the strip offers "Open it".
- The actions revalidate, so the screen under the provider refreshes itself.
- `statusPlacement="manual"` — the item form wants the strip under its header, not above it.

## Do not

- Add a change that skips the confirm dialogs or doesn't return a snapshot.
- Use this for the item form's Save — that's `saveMenuItem`, with its own status line.
