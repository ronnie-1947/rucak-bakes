# landing

The bands of the customer landing page, `/` — [src/app/(store)/page.tsx](<../../(store)/page.tsx>). Single locale (`en`), so no
sibling routes. The page sits inside the store-shell ([src/components/store-shell/](../../../components/store-shell/)), which supplies
the header, the banner, the cart and the one `Container`; the bands bring no gutters of their own.

## The bands, in render order

1. [hero/](hero/) — the owner's photo with the tagline on a warm band (the page's `h1`)
2. [day-strip/](day-strip/) — Baking today / Tomorrow tabs: status pill, order slots left, capacity bar, that day's items
3. [how-it-works/](how-it-works/) — three steps: pick, send, we call to confirm
4. [menu-grid/](menu-grid/) — Everything we bake: every active item, "Not today" faded
5. [visit-us/](visit-us/) — address + Maps, opening hours, phone (each only when set)

## The dict root

`dict.landing`: `hero` → hero, `dayStrip` → day-strip, `howItWorks` → how-it-works, `menuGrid` → menu-grid, `visitUs` → visit-us.
day-strip and menu-grid also take `dict.store` — the item card's strings (`store.item`) and day words (`store.days`), shared with the
other customer screens.

## Shared across the bands

- **One read model** — `loadLanding()` in [src/lib/storefront/landing.ts](../../../lib/storefront/landing.ts) feeds every band; it calls
  `connection()`, so the page renders per request (capacity moves with every order).
- **One card** — day-strip and menu-grid both render [src/components/item-card/](../../../components/item-card/).
- **Spacing** — the shell's `main` stacks the bands at 32px, 48px from `md`. Section headings are `h2` (`text-h2`); the hero's tagline
  is the page's only `h1`.
