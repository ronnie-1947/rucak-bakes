# admin-more

`/admin/more` ([page](<../../app/admin/(shell)/more/page.tsx>)) — the fifth tab on phones. The bottom bar has room for five
targets, so Customers, Settings and Sign out live behind it. From 768px the sidebar lists them directly.

## Files in this folder

```
admin-more/
  AdminMore.tsx   entry (server) — h1 and one bordered list
  README.md
```

## Component tree

```
AdminMore dict=dict.admin
├─ h1                              .more.title
└─ ul
   ├─ Link /admin/customers         .nav.customers · .more.customersHint
   ├─ Link /admin/settings          .nav.settings · .more.settingsHint
   └─ SignOutButton tone="list"     .shell.signOut
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/components/admin-shell/SignOutButton` | the sign-out row |
| `@/components/ui/icons/Icon` | row glyphs |

Tokens: `border-border`, `bg-sunken`, `text-muted`, `text-subtle`, `text-red`, `rounded-panel`, `text-h1`, `text-small-admin`.

## Props

```ts
AdminMore { dict: Dict["admin"] }
```

## How it works

Server component, no state. Each row is ≥ 56px tall. Sign out posts the `signOutStaff` action.

## Responsive behavior

| Width | Effect |
|---|---|
| all | one full-width list; gutters 16 / 24 / 32px |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.more`, `admin.nav` |
| Another row | the `links` array in `AdminMore.tsx` |

## Do not

- Put anything here the sidebar doesn't also reach — tablet and desktop never see this screen.
