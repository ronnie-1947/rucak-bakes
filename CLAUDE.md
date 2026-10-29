@AGENTS.md

# CLAUDE.md

Guidance for Claude Code when working in **sabiha-bakery**.

## Commands

| Script | Command |
|---|---|
| `pnpm dev` | `next dev` |
| `pnpm build` | `next build` |
| `pnpm start` | `next start` |
| `pnpm lint` | `eslint` |
| `pnpm telegram:test` | `tsx scripts/telegram-test.ts` — sends a test + sample order (`--dry-run` prints it) |
| `pnpm orders:sample` | `tsx scripts/sample-orders.ts` — 19 local menu orders (today … +5) through the real pipeline (needs the seed; re-runnable) |
| `pnpm orders:race` | `tsx scripts/order-race.ts` — CHECKPOINT 7b: same-key ×5, 20 orders at room for 15, 16 verifies at room for 10, all at once; cleans up after itself |
| `postinstall` | `prisma generate` |

Dev server runs on http://localhost:3000. Package manager: pnpm.

### Database

Local Postgres runs in Docker — `docker compose up -d --wait` (`docker-compose.yml`) —
with the `DATABASE_URL` from `.env.example`. Prisma 7: the URL lives in
`prisma.config.ts` (which loads `.env` the way Next does), and the client is generated
into `src/generated/prisma` (gitignored — `pnpm install` regenerates it).

| Task | Command |
|---|---|
| Apply pending migrations | `pnpm exec prisma migrate deploy` |
| Migration for a schema change | `pnpm exec prisma migrate dev --create-only --name <name>` — read the SQL before applying |
| Seed (needs `SEED_OWNERS`) | `pnpm exec prisma db seed` |
| Browse | `pnpm exec prisma studio` |
| Regenerate the client | `pnpm exec prisma generate` — Prisma 7's `migrate` no longer does it |

The `constraints` migration holds what the schema language can't express: CHECKs, the
order-code sequence, the immutable-code trigger, partial and trigram indexes. Never
edit an applied migration — add a new one.

## Stack

- **Next.js 16.3.8** — App Router. If this version is newer than your
  training data, read the bundled docs in `node_modules/next/dist/docs/`
  (`01-app/`, `03-architecture/`) before writing non-trivial App Router code.
- **React 19.2.8**
- **Tailwind CSS 4.3.3** — config-light, no `tailwind.config.*`;
  theme tokens live in `src/app/globals.css` under `@theme`.
- **TypeScript 5.9.3**, `strict: true`. Path alias `@/*` → `./src/*`.

## Deployment

Hosted on Vercel. `next/image` optimization and server actions are handled by the
platform with no extra configuration. Do not set `output: "export"` — it disables
both.

## Performance budget (mobile)

Heavy below-the-fold code is lazy-mounted behind an IntersectionObserver gate —
`src/components/ui/LazyOnView.tsx`.

No `LazyOnView` usages yet.

When adding a heavy widget below the fold (maps, charts, embeds, large forms,
third-party scripts), use `next/dynamic(..., { ssr: false })` **wrapped in
`LazyOnView`** rather than a bare client import. If the widget has a deep-link
anchor, the `id` goes on the `LazyOnView` wrapper so the scroll target exists at
first paint.

→ `/lazy-widget <Component>` performs the split. Details: the
`arkriti-nextjs-kit:nextjs-static-i18n` skill.

## Layout

```
prisma/
  schema.prisma         the nine models
  migrations/           init + constraints (raw SQL the schema can't express) + later additive ones
  seed.ts
scripts/                one-off tsx scripts (telegram-test.ts, sample-orders.ts, order-race.ts)
src/
  auth.ts               Auth.js — Google only, staff allowlist, requireStaff()
  proxy.ts              guards /admin/* (Next 16's renamed middleware)
  generated/prisma/     generated client — gitignored
  app/
    layout.tsx          the one root layout
    (store)/            customer screens: layout.tsx (StoreShell), page.tsx (the landing page, /), menu/[slug]/ (the item page), cart/
    globals.css         @theme tokens
    favicon.ico
    actions/            server actions — checkout.ts is the customer's (checkCart, createOrder; no sign-in), the rest are staff
    admin/login/        staff sign-in (outside the admin shell)
    admin/(shell)/      every signed-in screen: layout.tsx (requireStaff + AdminShell), orders/, menu/, more/ …
    api/auth/[...nextauth]/route.ts
    api/menu/[slug]/route.ts GET — the item page's live part (ItemLive: booking window, today's counter); the page itself is SSG
    sitemap.ts · robots.ts /sitemap.xml (landing + every active item) and /robots.txt — static, the menu actions revalidate the sitemap
    manifest.ts         /manifest.webmanifest — the installable app (name, icons incl. maskable, standalone); iOS reads appleWebApp in layout.tsx
    offline/            /offline — static, noindex; public/sw.js serves it for any page that can't load
    sections/           landing bands (colocated, never a route) — landing/: hero, reach-us, fresh-today, menu, visit-us, credit
  components/
    ui/                 Button (+ ButtonLink; variant, size, shape), CallLink (tel:), Checkbox, Chip(Link) (tone, size, shape), Container, Dialog, EmptyState, ItemsLine, ItemThumb, LazyOnView,
                        LinkSelect (?sort=), Meter, Notice, Rich, SearchBox (?q=), SelectBox (bulk tick), Skeleton (tone), Spinner (tone), StatusBadge, Switch,
                        Tag (tone, size), UndoBar; form: Field, TextInput (+ inputShellClasses), SelectField (tone), Stepper (size)
      icons/
    admin-login/        the /admin/login screen
    admin-shell/        sidebar / tab bar frame for /admin/(shell)
    admin-orders/       the orders queue;  admin-order-detail/  one order (page + 2xl pane)
    admin-new-order/    staff orders (/admin/orders/new): customer lookup by phone, lines with custom prices, the day strip (warns, never blocks
                        but closed), notes, summary card / bar / sheet, full-day confirm
    order-actions/      status changes + their confirm dialogs;  order-tag-list/  an order's fact tags
    admin-menu/         the menu library (/admin/menu): list / grid / table, Active switch, archive, undo
    admin-menu-item/    the item form (/admin/menu/new, /admin/menu/[id]): photos, details, ordering (online / notice / bake separately), live preview
    menu-actions/       activate / deactivate / archive / restore / duplicate + confirms and the undo strip
    admin-calendar/     the week planner (/admin/calendar): day cards — orders, live controls, counter-items — Copy last week, Apply to all days
    admin-calendar-day/ the day editor (/admin/calendar/[date]): the day's orders, counter-items (quantity made, override, sold out), settings, Fresh today preview
    close-day-dialog/   the confirm naming a day's orders before it closes (both calendar screens)
    admin-customers/    the customers list (/admin/customers): phone/name search, Show chips, cards / table, 2xl pane
    admin-customer-detail/ one customer (page + 2xl pane): contact, trust / block, counts, history, patterns, note
    customer-actions/   trust / block / unblock + the confirm and undo strip;  customer-flags/  Trusted / Blocked / New tags
    admin-daysheet/     the day sheet (/admin/daysheet): notes, For orders + Made to order, counter-items, pickups, Baked / Collected ticks, A4 print
    admin-settings/     settings (/admin/settings): five sections, save bars + leave guard, live switches, Telegram connect, staff access
    store-shell/        every customer screen's frame: banner, sticky header (home row on /, Back · title · cart elsewhere), View cart bar / pill,
                        StoreInfoProvider, CartProvider + switch-day dialog, PageTitleProvider, ServiceWorker (registers public/sw.js) — no install button: the browser's menu installs
    offline-screen/     the /offline page: You're offline, Try again (and reload on `online`), Go to the menu — no shell, renders from the worker's cache
    item-card/          a customer item card (photo, chip, price, green tag, Choose date / Call to order) and card.ts (priceParts, chip and action types)
    item-detail/        the item page (/menu/[slug]): SSG, rendered whole on the server + Product JSON-LD; only the order area is fetched; gallery, price + notice, counter block, pickup-date strip + legend + Add to cart (phone bar)
                        or the Call block, about / details / ingredients / allergens, related; availability.ts — each date judged by the deadline rule
    cart/               the cart (/cart): cart → details → order sent in one route — static page + skeleton, settings from the shell (useStoreInfo),
                        live-menu check, move day, Place order, refusals, confirmed
  content/
    en.json
  hooks/                useOrderActions, useMenuActions, useCustomerActions, useDaySheet (action contexts), useSettingsLeave (unsaved-changes guard),
                        useDismiss (popover close), useImageUpload (Cloudinary upload + discard from a component), useCart (the customer cart's context), useStoreInfo (the shell's pickup / delivery / phone / timezone), usePageTitle (the store header's title + usePageBack), useScrolled
  lib/
    content.ts          localePath / localeAlternates / htmlLang
    i18n.ts             locales, defaultLocale, getDictionary
    db.ts               Prisma singleton, serializable(), OrderError
    dates.ts            calendar dates, computeCutoffAt, bakery-local time
    money.ts            toPaise / formatPaise — Int paise only
    phone.ts            normalise → E.164 / formatForDisplay
    cloudinary.ts       imageUrl, toPublicId (public_id or delivery URL), browser uploadImage, UploadError (no secrets)
    cloudinary-server.ts signUpload, deleteFromCloudinary (by public_id or URL; refuses while in use) — server actions call these
    telegram.ts         notifyOwner, formatOrderMessage, TelegramError, botUsername / findChatWithCode (connect flow)
    template.ts         fill() for {placeholders} in dict strings
    site.ts             siteUrl / absoluteUrl — the public origin (SITE_URL, else Vercel's production domain) for canonical, OG, sitemap
    admin-routes.ts     ADMIN_HOME, admin sections, safeAdminPath (post-login redirects)
    orders/             status.ts (state machine), lifecycle.ts (transitions), place.ts (placeOrder tx — customer and staff rules, READ COMMITTED + day lock),
                        notify.ts, queries.ts (admin read models), filters.ts (queue URL state),
                        checkout.ts (checkout schema, refusals, form rules — client-safe), rate-limit.ts (7.3: by phone, by IP)
                        deadline.ts (the order-ahead deadline rule, client-safe), booking.ts (newMenuDay, the booking window),
                        staff-order.ts (staff order schema, warnings, missing step — client-safe), new-order.ts (the staff form's read model)
    menu/               queries.ts (library read model), filters.ts (URL state), changes.ts (writes + undo snapshots),
                        item.ts (form read model), form.ts (form values + rules, client-safe), save.ts (form writes),
                        copy.ts, units.ts, allergens.ts, about.ts (the About text's marks → blocks, client-safe)
    calendar/           week.ts / day.ts (read models), writes.ts (patchDay, applyToWeek, copyWeek, saveDay),
                        form.ts (DayPlan + rules, client-safe), cutoffs.ts, copy-plan.ts (planWeekCopy), routes.ts
    customers/          queries.ts (list + trigram search), detail.ts (record read model), changes.ts (flags, rename, note),
                        filters.ts (URL state, client-safe), limits.ts, lookup.ts (one customer by phone or id, for the staff form)
    daysheet/           queries.ts (read model + poll version), ticks.ts (setItemBaked, setLineBaked, setCounterBaked, setCollected), routes.ts (URL state),
                        tick.ts (tick keys), notes.ts (allergen words) — client-safe except queries/ticks
    settings/           row.ts (getSettings() / findSettings() — the singleton row, cached per request), queries.ts (screen read model),
                        writes.ts, telegram.ts (connect code, state, recordDelivery), form.ts (values + rules, client-safe),
                        hours.ts (opening hours + hoursRuns, client-safe), sections.ts (?section=, client-safe),
                        social.ts (Instagram / Facebook: socialPath, socialValid, socialUrl — client-safe)
    storefront/         customer read models: shell.ts (banner, today), landing.ts (Fresh today, catalogue, categories, visit),
                        item.ts (loadItemPage — the item, related: the SSG page; loadItemLive — the booking window, today's counter; activeItems), catalogue.ts (card columns, menu order),
                        counter.ts (today's counter-items, the counter's closing time), types.ts (StoreItem, FreshToday…, client-safe),
                        words.ts (relativeDay, noticeChip, noticeLength, client-safe), routes.ts (itemHref, ?day=, client-safe),
                        cart.ts (the cart page's days + fulfilment, checkLines — the cart's lines vs a day's live menu)
    cart/               cart.ts (localStorage['bakery.cart'] model, pure), store.ts (external store for useSyncExternalStore),
                        check.ts (reconcile — the live-menu check applied, pure), customer.ts (localStorage['bakery.customer'])
    pwa/                register.ts (registerServiceWorker — production only), app.ts (theme + background hex for the manifest and theme-color)
public/
  sw.js                 the service worker, hand-written (no build step): offline page, cache-first /_next/static, network-first customer
                        pages with a kept copy (4s slow-network cutoff), admin never stored — bump VERSION when its caching changes
  favicon/              favicons, android-chrome (any) + maskable icons, opaque apple-touch-icon
```

→ Which directory a new file belongs in, and what its folder is called, is
defined in the `arkriti-nextjs-kit:project-conventions` skill. Read its placement
table before creating a file. Every component folder is kebab-case; every `.tsx`
inside it is PascalCase.

**There is no `src/app/<route>/components/` folder in this project, and there
must never be one.** A route directory holds `page.tsx`, its locale siblings, and
server-only data modules — nothing that renders.

Components live in exactly two trees:

| Tree | Holds |
| --- | --- |
| `src/app/sections/` | landing bands — see **Section groups** below |
| `src/components/` | everything else: leaf primitives in `ui/`, and each composed major component as its own kebab-case folder holding the parts that make it up |

`src/app/sections/` is the **only** component tree under `src/app/`, and it is
not a route: App Router creates a URL only for a folder containing `page.tsx` or
`route.ts`, and nothing under `sections/` ever contains either. Never add one
there — it would turn a component folder into a URL.

A part earns its place in a folder by being used nowhere else; the moment
something outside imports it, promote it to `ui/` or to its own folder.

### Section groups

A band that exists **only for one page** lives in that page's group — a folder
under `sections/` named after the page:

```
src/app/sections/
  sessions/                 group, named for the page it serves
    README.md               index: the bands, in render order
    intro/
      Intro.tsx
      README.md
    quote/
      Quote.tsx
      README.md
  pricing/                  ungrouped: more than one page imports it
    Pricing.tsx
    README.md
```

- **Never prefix sibling folder names to express the grouping.**
  `sessions-intro/` beside `sessions-quote/` is a naming convention standing in
  for a structural one. If a prefix repeats across siblings, that prefix is the
  group.
- **Exactly one group level.** `sections/<group>/<band>/`, never a third. Inside
  a band folder, files are flat.
- **A group is a namespace, not a component** — section folders and its own
  `README.md`, no `.tsx` of its own. One component that renders every band would
  be a major component under `src/components/`.
- **Promote, don't duplicate.** When a second page starts importing a grouped
  band, move it up to `src/app/sections/<band>/` — folder, README, and dict key
  together, in one change.
- **One group serves every locale.** Locale routes import the same entries.
- **The dict mirrors the folders** — `dict.sessions.intro`, not
  `dict.sessionsIntro`. The page passes each band only its own slice.

→ `/new-section <Page>/<Name>` creates a grouped band; `/new-section <Name>`
creates an ungrouped one. Details: §3.1 of the
`arkriti-nextjs-kit:project-conventions` skill.

## Routing & i18n

Locales: `["en"]`. Source locale: **en**.

The source locale owns the bare route; every other locale is a **literal trailing
segment**:

| Locale | File | URL |
|---|---|---|
| en | `src/app/<route>/page.tsx` | `/<route>` |
| — none (single-locale project) | `src/app/<route>/<locale>/page.tsx` | `/<route>/<locale>` |

Homepages are the exception: `/` and `/<locale>`. With one locale, every route
is bare — add a locale to `locales` and a `src/content/<locale>.json` before
creating any sibling segment.

- `src/lib/i18n.ts` owns `locales`, `defaultLocale`, and the dictionary getter
  **`getDictionary`** (async).
- `src/lib/content.ts` provides `localePath`, `localeAlternates`, and `htmlLang`.
  Use these rather than concatenating locale paths by hand.
- **No `[lang]` dynamic segment, no locale prefix, no locale route groups, and no
  `generateStaticParams` for a language param.** The suffix pattern is what keeps
  every route statically pre-rendered at a literal on-disk path.
- **One root layout for every locale.** Only a root layout may render `<html>`,
  so it declares one `lang` — the source locale's. Every page re-declares its own
  on its outermost element: `<div lang={htmlLang(locale)} className="contents">`.
- Components receive copy through a `dict` prop. A section must **never** import
  a content JSON directly.

→ `/new-page <slug>` scaffolds one route per locale. `/i18n-add <key> …` adds a
key to every locale file atomically. Details: the
`arkriti-nextjs-kit:project-conventions` and `i18n-content` skills.

## Conventions

- **Server Components by default.** `"use client"` only when a component
  genuinely needs browser APIs, state, or event handlers — and keep it as low in
  the tree as possible.
- **Fully static.** Every route pre-renders. No runtime content fetching — copy
  resolves from `src/content/*.json` at build time. Server actions live in
  `src/app/actions/` and are the exception, not the rule.
  *Project note:* this app also reads orders, menu days, and settings from
  Postgres (admin screens, cart revalidation, the order pipeline). The static
  rule governs **copy**; application data is server truth, read at request time.
  See `dev-docs/implementation.md`.
- **Every admin server action starts with `await requireStaff()`** (`src/auth.ts`).
  `proxy.ts` guards page navigations only — a server action is a separate entry
  point, and the JWT outlives a staff member's deactivation. Owner-only actions (settings,
  staff access) start with `await requireOwner()` instead — it runs `requireStaff()` first.
- **No hardcoded user-facing text.** Every string lives in a locale file and
  reaches the component through `dict`.
- **Tailwind only.** No inline `style={{}}`. Use `@theme` tokens over raw hex.
- **The design system is locked** (`dev-docs/implementation.md` §2). `globals.css` resets
  Tailwind's default colour, radius, type, font-weight and shadow scales, so only its
  tokens exist — `bg-o700`, `text-muted`, `rounded-card`, `text-body-admin`,
  `shadow-raised`. A default class like `text-sm`, `rounded-lg` or `bg-orange-500`
  silently generates nothing. Spacing keeps the 4px base: use only `1 2 3 4 6 8 12`.
- **App Router only.** Never introduce a `pages/` directory.

→ Details: the `arkriti-nextjs-kit:nextjs-static-i18n` and `i18n-content` skills.

## Component splitting

One component per file — strictly. No nested component definitions, no anonymous
JSX helpers returning markup, and an explicit typed props interface on every
component. Prefer over-splitting.

Sections and major components compose primitives from `src/components/ui/` and
must not redefine button styles, card chrome, or popover behavior locally. A
design that wants a new button look gets a new **variant** in `Button.tsx`'s
typed class map, never a second button component.

Every section and every major composed component ships a `README.md`, written in
the same change as the code and kept in sync with it — its **Files in this
folder** section is what makes a flat folder of eight parts readable. Every
section group ships one too, as a short index of its bands in render order. Leaf
primitives in `src/components/ui/` do not.

**A page never composes parts.** If a route's `page.tsx` imports more than one
rendering component that is not a section, a major component is missing: create
`src/components/<kebab-name>/`, put the composition in its entry file, and let
the page import that one entry. Stacking a group's band entries in visual order
is the exception — that is a page doing its job.

→ `/new-section`, `/new-component`, `/new-ui-primitive`. Details: the
`arkriti-nextjs-kit:component-architecture` skill, and the README template in
`project-conventions/references/`.

## Code Style

- **No semicolons.**
- **2-space indentation.**
- **150-character print width.**
- Style variants use a typed class map (`Record<Variant, string>`), not
  conditional string concatenation.

→ Details: the `arkriti-nextjs-kit:code-style` skill.

## Responsive Design & Breakpoints

Breakpoints come from `@theme` in `src/app/globals.css` — Tailwind is
config-light, so those tokens *are* the scale. This project extends the default
on both ends.

| Token | Width | Source |
|---|---|---|
| `xxxs` | 20rem / 320px | custom |
| `xxs` | 23.43rem / 375px | custom |
| `xs` | 30rem / 480px | custom |
| `sm` | 40rem / 640px | Tailwind default |
| `md` | 48rem / 768px | Tailwind default |
| `lg` | 64rem / 1024px | Tailwind default |
| `xl` | 80rem / 1280px | Tailwind default |
| `2xl` | 100rem / 1600px | overridden (default 96rem) |
| `3xl` | 120rem / 1920px | custom |

- **Mobile-first.** Author base styles at the smallest token and enhance upward.
- **Don't skip the small custom breakpoints.** Buttons, navs, hero copy, and
  grids must stay legible and tappable at 320px, with touch targets ≥ 44px.
- **Design for the large end too** — cap line lengths, scale type, and widen
  gutters so content isn't sparse at 1600px+.
- **`Container.tsx` is the single source of truth** for max-width and horizontal
  gutters. Extend it there; never re-declare `max-w-*` + `px-*` in a section.
- Changing a breakpoint means editing the `--breakpoint-*` tokens in
  `globals.css`.

→ `/responsive-audit <Component>` sweeps the full scale. Details: the
`arkriti-nextjs-kit:responsive-breakpoints` skill.
