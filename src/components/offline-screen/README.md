# offline-screen

The page the service worker ([public/sw.js](../../../public/sw.js)) serves when a page can't load and it has no copy of that
page — "You're offline", Try again, and a way back to the menu. Rendered by [src/app/offline/page.tsx](../../app/offline/page.tsx)
(static, `noindex`, never linked). The worker stores it, with every `/_next/static` file its HTML names, when it installs — so it
renders styled with no network at all.

## Files in this folder

```
offline-screen/
  OfflineScreen.tsx   entry (server) — the wifi-off disc, heading, body, Try again, Go to the menu, centred in a narrow Container
  RetryButton.tsx     "use client" — reloads the page; also reloads by itself on the browser's `online` event
  README.md
```

## Component tree

```
OfflineScreen dict=dict.offline
└─ Container as="main" width="narrow"
   ├─ Icon wifiOff                (in an o50 disc, decorative)
   ├─ h1 title · p body
   ├─ RetryButton label=retry     Button lg, full width
   └─ ButtonLink href="/" link    Go to the menu
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/components/ui/*` | `Container`, `Button`, `ButtonLink`, `Icon` (`wifiOff`) |
| `@/lib/i18n` | `Dict["offline"]` |

Tokens: `bg-o50`, `text-o700`, `text-muted`, `rounded-pill`, `text-h1`.

## Props

```ts
OfflineScreen { dict: Dict["offline"] }
RetryButton   { label: string }
```

## How it works

- **The address bar keeps the page that failed.** The worker answers that URL with this page's HTML, and Next's router takes
  its initial URL from `location.href`, so Try again (`location.reload()`) asks for the page the visitor wanted, not `/offline`.
- **Coming back online reloads by itself** — no tap needed.
- **Go to the menu** — `/` is usually stored (the worker keeps a copy of every customer page it has served), so it works offline
  too; if not, the worker serves this page again.
- **No store shell.** The shell's header and cart would only lead to more pages that can't load, and admin pages fall back here as
  well.
- Server: `OfflineScreen`. Client: `RetryButton`.

## Responsive behavior

| Width | Effect |
|---|---|
| base (320px+) | one centred column, buttons full width up to 24rem |
| `md`+ | the same column, centred in the viewport; `narrow` Container caps it |

## How to make changes

| Goal | File |
|---|---|
| Copy | `src/content/en.json` → `offline`; the tab title → `meta.offline.title` |
| Which pages fall back here, the slow-network wait | [public/sw.js](../../../public/sw.js) — bump `VERSION` when its caching changes |

## Do not

- Don't put anything here that needs the network or the database — it is shown precisely when neither is reachable.
- Don't add the store shell, or a second client component that loads extra chunks: the worker stores only what `/offline`'s own
  HTML names at install.
- No inline `style`, no hardcoded strings, one component per file.
