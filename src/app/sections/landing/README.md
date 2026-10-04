# landing

The bands of the customer landing page, `/` — [src/app/(store)/page.tsx](<../../(store)/page.tsx>). Single locale (`en`), so no
sibling routes. The page sits inside the store-shell ([src/components/store-shell/](../../../components/store-shell/)), which supplies
the header, the banner, the cart and the one `Container`; the bands bring no gutters of their own.

## The bands, in render order

1. [hero/](hero/) — the owner's photo with the tagline on a warm band (the page's `h1`)
2. [fresh-today/](fresh-today/) — today's counter-items (§10R): status pill, walk in / Call, cards that open the item; or orders only / closed
3. [menu/](menu/) — Everything we bake: category chips, every active item with its notice, Choose date or Call to order
4. [visit-us/](visit-us/) — address + Maps, opening hours, phone (each only when set)

Removed in 7R.4: `day-strip` (became fresh-today), `menu-grid` (became menu) and `how-it-works` — folders, READMEs and dict keys together.

## The dict root

`dict.landing`: `hero` → hero, `freshToday` → fresh-today, `menu` → menu, `visitUs` → visit-us. fresh-today and menu also take
`dict.store` — the item card's strings (`store.item`), the notice words (`store.notice`) and day words (`store.days`), shared with the
other customer screens.

## Shared across the bands

- **One read model** — `loadLanding()` in [src/lib/storefront/landing.ts](../../../lib/storefront/landing.ts) feeds every band; it calls
  `connection()`, so the page renders per request (the counter and its sold-out marks change through the day).
- **One card** — fresh-today and menu both render [src/components/item-card/](../../../components/item-card/), and both grids are
  2 / 3 / 4 columns with 12px gaps. Nothing on the landing page adds to the cart: ordering starts on the item page (§10R).
- **Spacing** — the shell's `main` stacks the bands at 32px, 48px from `md` (the design's 56 / 64px at 1280 / 1920 are off the locked
  spacing scale, so they stay 48px). Section headings are `h2` (`text-h2`); the hero's tagline
  is the page's only `h1`.
