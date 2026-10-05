# store-shell

The frame around every customer screen — rendered once by the `(store)` route group's layout
([layout.tsx](<../../app/(store)/layout.tsx>)), so the landing page (`/`), the item page (`/menu/[slug]`) and the cart (`/cart`) share it. It
holds the pause / announcement strip, the sticky header with the cart, the page's one `Container`, the View cart bar, the cart itself
(`CartProvider`) and the header's page title (`PageTitleProvider`). Imported from `Bakery Order Landing.dc.html` (header, bar and pill)
and `Menu-slug.dc.html` (the Back · title · cart header). Read model:
[src/lib/storefront/shell.ts](../../lib/storefront/shell.ts); cart model: [src/lib/cart/](../../lib/cart/).

## Files in this folder

```
store-shell/
  StoreShell.tsx        entry (server) — CartProvider + PageTitleProvider around banner, header, <main> Container, CartBar
  CartProvider.tsx      "use client" — the cart over localStorage (useSyncExternalStore), stale-cart drop, the switch-day dialog (context: hooks/useCart)
  PageTitleProvider.tsx "use client" — holds the sub-page header's title and the page's own Back, set by the page below (context: hooks/usePageTitle)
  SwitchDayDialog.tsx   "use client" — "Switch to Saturday?" before a cart for another day is cleared
  StoreBannerStrip.tsx  the line above the header: pause reason (red) or announcement (warm)
  StoreHeader.tsx       "use client" — the sticky <header>: HomeBar on /, PageBar elsewhere; remembers the visit's first page
  HomeBar.tsx           "use client" — logo (/logo.png), name (home link), "Pickup at …", CartButton; condenses once scrolled
  PageBar.tsx           "use client" — Back (or the page's own, usePageBack), logo + name (home link), the page's title (faded in once its h1
                        scrolls away), CartButton (not on /cart)
  CartButton.tsx        "use client" — 44px cart square with the unit-count badge
  CartBar.tsx           "use client" — View cart: bottom bar on phones, floating pill from 768px; hidden when empty, on /cart and on /menu/*
  copy.ts               StoreCopy / CartCopy types, itemsText, cartLabel
  README.md
```

## Component tree

```
StoreShell data=StoreShellData dict=dict.store
└─ CartProvider today dict={ shell, switchDay, days }
   ├─ PageTitleProvider
   │  ├─ StoreBannerStrip banner                   (only when paused or an announcement is on)
   │  ├─ StoreHeader bakeryName place dict.shell   <header> sticky
   │  │  ├─ HomeBar  (on /)                          logo + name + "Pickup at …" + CartButton
   │  │  └─ PageBar  (elsewhere)                     Back + logo + name + title + CartButton
   │  ├─ Container as="main"  ← the page's bands stack here, gap-8 / md:gap-12
   │  └─ CartBar dict.shell                          spacer div + bottom bar (<md) + pill (md+)
   └─ SwitchDayDialog request                      (rendered by the provider; opens on a cross-day add)
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/shell` | `StoreShellData` (name, place, banner, today) |
| `@/lib/storefront/types` | `StoreBanner` |
| `@/lib/storefront/words` | `relativeDay` — "today" / "tomorrow" / weekday in the dialog |
| `@/lib/cart/cart` | pure cart model: `withQuantity`, `conflictsWith`, `isStale`, `cartCount`, `cartSubtotal`, `quantityOf`, `AddTarget` |
| `@/lib/cart/store` | the external store: `subscribeCart`, `getCart`, `getServerCart`, `writeCart` |
| `@/hooks/useCart` | `CartContext`, `CartApi` |
| `@/hooks/usePageTitle` | `PageTitleContext`, `usePageTitleState` (the page side calls `usePageTitle`, and `usePageBack` to take Back over) |
| `@/hooks/useScrolled` | HomeBar condensing |
| `@/components/ui/*` | `Container`, `Button`, `ButtonLink` (`shape="pill"`), `Dialog`, `Icon` (`cart`, `chevronLeft`) |
| `@/lib/money` · `@/lib/template` | `formatPaise`, `fill` |

External: `next/link`, `next/image` (`/logo.png`), `next/navigation` (`usePathname`, `useRouter`). Tokens: `bg-red-soft`, `text-red`, `bg-o50`, `bg-o700`, `text-o700`,
`border-border`, `bg-sunken`, `shadow-raised`, `rounded-button`, `rounded-pill`, `text-h1`, `text-h2`, `text-small`, `text-micro`,
`font-display`, utility `pb-safe-lg`; breakpoints `md`, `lg`.

## Props

```ts
StoreShell       { data: StoreShellData; dict: Dict["store"]; children }
CartProvider     { today: IsoDate; dict: CartCopy; children }
PageTitleProvider { children }
SwitchDayDialog  { request: { from; to; count } | null; today; onConfirm; onClose; dict: CartCopy }
StoreBannerStrip { banner: StoreBanner; dict: StoreCopy["shell"] }
StoreHeader      { bakeryName; place: string | null; dict: StoreCopy["shell"] }
HomeBar          { bakeryName; place: string | null; dict: StoreCopy["shell"] }
PageBar          { bakeryName; canGoBack: boolean; showCart: boolean; dict: StoreCopy["shell"] }
CartButton       { dict: StoreCopy["shell"] }
CartBar          { dict: StoreCopy["shell"] }
```

`CartCopy` is `{ shell, switchDay, days }` — the provider is a client component, so only the strings it uses cross to the browser.

## How it works

- **The cart** lives in `localStorage['bakery.cart']` as `{ items: [{ menuItemId, slug, name, priceSnapshot, qty, imageId }],
  fulfilmentDate, updatedAt }` (runbook 6.3). `src/lib/cart/store.ts` keeps one parsed snapshot and re-reads on the `storage` event, so
  two tabs agree. The server (and the first client render) sees an empty cart; the real one appears right after hydration — the badge
  and bar come in then, never mismatched. Storage that throws (private mode) leaves a page-lifetime cart.
- **Stale carts** — on mount the provider drops a cart whose day is before `today` (bakery-local, from the server) or that hasn't
  been touched in 24 hours.
- **One day per cart** — `setQuantity` for a day other than the cart's opens `SwitchDayDialog` ("Switch to tomorrow? Your cart has
  3 items for today…"); only Clear cart and add replaces it. Keep my cart, Escape or the scrim leave everything as it was.
- **`replace(cart)`** swaps the whole cart without the dialog — only the cart page uses it, to apply the live menu or move day.
- **Prices** are what the customer was shown (`priceSnapshot`), re-taken on every add. Display only — the order pipeline prices the
  order on the server.
- **Banner** — `storeBanner()` gives pause precedence over the announcement, as the settings preview does. Paused is `role="alert"`.
- **Header** — sticky, `shadow-raised` (a sticky bar may have one). Two rows, by path:
  - **HomeBar** on `/`. `useScrolled` condenses past 64px and expands only above 8px — the logo drops from 44px to 32px, the name from
    `text-h1` to `text-h2`, and the address line goes, so the header shrinks by up to ~42px; scroll anchoring then moves `scrollY` by as much, and a single
    threshold would flip-flop into a render loop. Keep the gap wider than the shrink. No animation — sizes aren't transform or opacity.
    The logo (`public/logo.png`, decorative `alt=""`) is a second link home for the pointer only — `tabIndex={-1}` and `aria-hidden`,
    so keyboards and screen readers meet one home link, the name.
  - **PageBar** everywhere else (the item and cart designs): Back, the logo and name (one home link, `{name}, home`), the title centred
    in the space left, the cart; 61px tall. The title is the page's own —
    a page calls `usePageTitle(text, h1Id)` and it fades in (opacity + 4px rise, 150ms) once that h1 has scrolled under the header.
    It's `aria-hidden`: the h1 is the heading. While it shows, phones (<768px) drop the bakery's name and keep the logo, so the title
    has the room. **Back** is a link to `/`, so it works before hydration and after a direct visit; once
    the visit has moved past its first page (`StoreHeader` keeps that path), it calls `router.back()` instead, which returns to the
    menu at the same scroll position. It never steps back off the site.
    A page with steps of its own takes Back over with `usePageBack(handler)` — the cart's details step returns to the cart that way. On
    `/cart` the cart button gives way to a 44px space, so the row keeps its balance.
- **CartBar** renders nothing while the cart is empty, on `/cart`, or on an item page (`/menu/*` — its own bottom bar has Add to cart
  and then View cart, and two fixed bars would stack). When shown it puts a spacer in the flow (`h-32` / `md:h-24`) so
  the page's last lines clear it. Phones: fixed bottom bar, count + total over a 48px button, `pb-safe-lg` clears the home indicator.
  From `md`: a floating 48px pill bottom-right with the count in a white disc, its accessible name spelling out count and total.
- Server: `StoreShell`, `StoreBannerStrip`. Client: the rest — state (cart), scroll, pathname, dialog.

## Responsive behavior

| Width | Effect |
|---|---|
| base (320px+) | header `py-3`, logo 44px (condensed 32px), name `text-h1` (condensed `text-h2`); View cart is a full-width bottom bar |
| `md` 768px | HomeBar `py-4` (PageBar stays `py-2`); PageBar keeps the bakery's name beside the page title; View cart becomes the floating pill, 24px from the corner; main gap 48px |
| `lg` 1024px | pill 32px from the corner; main top padding 32px |
| `2xl`/`3xl` | Container widens (88rem / 100rem) |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Header / cart / dialog copy | `src/content/en.json` → `store.shell`, `store.switchDay`, `store.days` |
| Which paths get the Back row | `StoreHeader` ([StoreHeader.tsx](StoreHeader.tsx)) — everything but `/` |
| A sub-page's header title | call `usePageTitle` from the page ([src/hooks/usePageTitle.ts](../../hooks/usePageTitle.ts)); see item-detail's `TitleSync` |
| What the cart stores, expiry, line cap | [src/lib/cart/cart.ts](../../lib/cart/cart.ts) |
| Storage key or cross-tab behaviour | [src/lib/cart/store.ts](../../lib/cart/store.ts) |
| What the cart API offers components | [src/hooks/useCart.ts](../../hooks/useCart.ts) + [CartProvider.tsx](CartProvider.tsx) |
| Banner precedence | `storeBanner` in [src/lib/storefront/shell.ts](../../lib/storefront/shell.ts) |
| Bar / pill look | [CartBar.tsx](CartBar.tsx); the pill's shape is `Button`'s `shape="pill"` |
| Page gutters / band spacing | the `Container` in [StoreShell.tsx](StoreShell.tsx) |

## Do not

- Don't trust `priceSnapshot` anywhere but on screen — never send it as a price.
- Don't read `localStorage` during render outside the store — it breaks hydration. Go through `useCart`.
- Don't let a second cart-day dialog appear elsewhere; adds go through `setQuantity`, which owns the confirm.
- No inline `style`, no hardcoded strings, one component per file.
