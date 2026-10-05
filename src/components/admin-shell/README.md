# admin-shell

The frame around every signed-in admin screen — rendered by [src/app/admin/(shell)/layout.tsx](<../../app/admin/(shell)/layout.tsx>),
which calls `requireStaff()` first. The login screen sits outside the `(shell)` route group and never gets it.

## Files in this folder

```
admin-shell/
  AdminShell.tsx     entry (server) — one viewport tall; `main` is the scroll container and (`relative`) the containing block,
                     so no `sr-only` / absolute part of a screen can escape it and scroll the document
  Sidebar.tsx        ≥768px: 220px ink column — bakery, today, all six screens, who's signed in, sign out
  TabBar.tsx         <768px: five bottom tabs (Orders, Day sheet, Calendar, Menu, More), clear of the home indicator
  MobileHeader.tsx   <768px: bakery, today, "N pending" (links to the pending filter)
  NavLink.tsx        "use client" — a sidebar row or a tab; usePathname() for the active state
  SignOutButton.tsx  form → actions/auth.ts signOutStaff; `sidebar` and `list` (More screen) tones
  nav.ts             tabNav / sidebarNav entries, and `sidebarRow` (shared row classes)
  types.ts           AdminCopy, ShellData
  README.md
```

## Component tree

```
AdminShell dict=dict.admin data=ShellData
├─ Sidebar (hidden <md)
│  ├─ bakeryName · todayLabel
│  ├─ NavLink × 6  (sidebarNav)          dict.admin.nav.*; Orders carries data.pendingCount
│  └─ shell.signedInAs · SignOutButton    dict.admin.shell.*
└─ column
   ├─ p.status (only when ADMIN_AUTH_BYPASS)  dict.admin.shell.bypass
   ├─ MobileHeader (md:hidden)              shell.pending
   ├─ main#admin-main (relative)  ← the page
   └─ TabBar (md:hidden) → NavLink × 5 (tabNav)
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/app/actions/auth` | `signOutStaff` |
| `@/components/ui/icons/Icon` | nav glyphs |
| `@/lib/admin-routes` | `AdminSection` |
| `@/lib/template` | `fill` |

External: `next/link`, `next/navigation` (`usePathname`). Tokens: `bg-sidebar`, `text-background`, `text-subtle`, `bg-o500` (active
marker), `bg-o700` (badge), `text-o700`, `bg-o50`, `border-border`, `text-body-admin`, `text-small-admin`, `text-micro`, `text-h2`,
`font-display`, `rounded-chip`, `rounded-pill`, `pb-safe`, breakpoint `md`.

## Props

```ts
AdminShell    { dict: AdminCopy; data: ShellData; children }
Sidebar       { dict; data }
TabBar        { dict; pendingCount: number }
MobileHeader  { dict; data }
NavLink       { href; label; icon: IconName; match: string[]; variant: "sidebar" | "tab"; badge?: number; badgeLabel?: string }
SignOutButton { label: string; tone: "sidebar" | "list" }
ShellData     { bakeryName; todayLabel; pendingCount; staffName; bypassed }
```

## How it works

- `h-dvh` shell, `main` scrolls. A screen's `sticky top-0` bars stick inside `main`, under nothing; the tab bar is a flex
  child, so it never covers content and needs no spacer.
- The pending badge counts PENDING orders from today on (`shell-data.ts`). Order actions call
  `revalidatePath("/admin", "layout")`, so the badge refreshes with the screen.
- `More` lights up for `/admin/more`, `/admin/customers` and `/admin/settings` (its `match`).
- Server components except `NavLink` (pathname). Sign-out is a plain form — works before hydration.
- **Print** — the sidebar, header, tab bar and bypass line are `print:hidden`, and the shell drops its one-viewport height so `main`
  flows onto paper. Only the day sheet has a print layout (`admin-daysheet/PrintSheet.tsx`).

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` | mobile header + bottom tab bar; Customers and Settings via More |
| `md`+ (768, incl. the 820 kitchen tablet) | 220px sidebar, no header, no tab bar |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Add a screen | `adminSections` in `src/lib/admin-routes.ts`, `dict.admin.nav`, `sidebarNav` (and `tabNav` or More) in `nav.ts`, an icon in `ui/icons/Icon.tsx` |
| Nav copy | `src/content/en.json` → `admin.nav`, `admin.shell` |
| What the badge counts | `src/app/admin/(shell)/shell-data.ts` |

## Do not

- Put a page's own sticky bars outside `main`, or give `body` the scroll back.
- Add a sixth tab — the bar is sized for five 44px+ targets at 320px.
- Read session state here; the layout's `requireStaff()` already did.
