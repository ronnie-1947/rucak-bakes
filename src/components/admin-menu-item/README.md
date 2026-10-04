# admin-menu-item

The menu item form — one form for `/admin/menu/new` ([page](<../../app/admin/(shell)/menu/new/page.tsx>)) and
`/admin/menu/[id]` ([page](<../../app/admin/(shell)/menu/[id]/page.tsx>)) — imported from `Admin-Menu-Item.dc.html`.
Photos are the section that matters most. Data: [src/lib/menu/item.ts](../../lib/menu/item.ts); rules shared with the server:
[src/lib/menu/form.ts](../../lib/menu/form.ts); saving: `saveMenuItem` in [src/app/actions/menu.ts](../../app/actions/menu.ts).

## Files in this folder

```
admin-menu-item/
  AdminMenuItem.tsx      entry (server) — MenuActionsProvider (manual status) around the form, keyed by id + archived state
  MenuItemForm.tsx       "use client" — layout, header, notices, the four sections, save card / bar, preview sheet, leave dialog
  useItemForm.ts         the form's state: fields, photo drafts and their uploads, changes, problems, save / discard
  useReorder.ts          drag-handle reorder (pointer events + arrow keys) for gallery photos and ingredient chips
  ItemFormHeader.tsx     back, name + Active/Inactive badge, Preview (<1024), ⋯ menu
  ItemFormMenu.tsx       "use client" — ⋯: Duplicate, Archive
  ErrorSummary.tsx       red block after a refused save; each line scrolls to its section
  ArchivedNotice.tsx     "use client" — "Archived Mon 12 Jan …" + Restore
  FormSection.tsx        a section card (id anchor, h2, red frame when invalid)
  BasicsSection.tsx      name, SlugLine, short description (80), CategoryPicker, PriceField + UnitPicker, Active switch
  SlugLine.tsx           "/menu/slug · Edit"; warns when a saved address changes
  CategoryPicker.tsx     chips + "+ Add category" (created on save)
  PriceField.tsx         ₹-prefixed rupees, stored as paise
  UnitPicker.tsx         Each / Per box / Per kg / Per slice + "Customers see ₹70 each"
  PhotosSection.tsx      hidden file input, CoverZone, GalleryGrid, "n of 6", AltTextList
  CoverZone.tsx          4:3 drop zone / cover with Replace + Remove, ring, Retry
  GalleryGrid.tsx        1:1 tiles (3 / 4 across) + "Add photos" drop tile
  PhotoTile.tsx          one gallery photo: handle, remove, Set as cover, ring, Retry, error line
  PhotoImage.tsx         the picked blob or the Cloudinary rendition, faded while uploading / failed
  ProgressRing.tsx       upload progress (role=progressbar)
  AltTextList.tsx        "Alt text (optional)" disclosure, one input per photo
  DetailsSection.tsx     AboutField, IngredientInput, AllergenPicker
  OrderingSection.tsx    "use client" — "Customers can order this online", Notice stepper 0–7 + what it means for a Saturday pickup
                         (or the sunken call-only line), "Bake each order separately"
  AboutField.tsx         textarea (600) with B / I / bullet toolbar — plain-text marks, no HTML
  IngredientInput.tsx    chips: Enter or comma adds, Backspace removes, drag to reorder, "Used before:" suggestions
  AllergenPicker.tsx     the fixed 7, red-tinted toggles
  FulfilmentSection.tsx  usual counter batch (Stepper), weight/size, storage note
  ArchiveCard.tsx        "use client" — detached 32px, red heading, opens the archive confirm
  SaveStatus.tsx         dot + "2 unsaved changes · See changes" / "Fix 1 error to save" / "All changes saved"
  SaveActions.tsx        Discard · Save and add another (create) · Save item / Create item
  SaveCard.tsx           ≥1024: status + actions at the top of the sticky right column
  SaveBar.tsx            <1024: sticky bottom bar while there's something to save
  ItemPreview.tsx        the customer's menu card (notice chip, Choose date / Call to order) and item-page header, live
  ItemPerformance.tsx    ≥1600 (saved items): last 30 days (orders, units, counter days, counter sold out) + coming up by date
  LeaveDialog.tsx        "Leave without saving?" naming what changed
  copy.ts                problemText, inlineError, changesText, noticeValue, noticeHelp
  types.ts               AdminCopy, ItemCopy
  README.md
```

## Component tree

```
AdminMenuItem dict=dict.admin page justCreated
└─ MenuActionsProvider statusPlacement="manual"            (src/components/menu-actions)
   └─ MenuItemForm                                          .menuItem.*
      ├─ ItemFormHeader > ItemFormMenu (saved, not archived)
      ├─ MenuActionsStatus · Notice (created) · ArchivedNotice · ErrorSummary
      ├─ BasicsSection > SlugLine, CategoryPicker, PriceField, UnitPicker, Switch (ui)
      ├─ PhotosSection > CoverZone, GalleryGrid > PhotoTile × n, AltTextList
      ├─ DetailsSection > AboutField, IngredientInput, AllergenPicker
      ├─ OrderingSection > Switch, Stepper (ui)
      ├─ FulfilmentSection > Stepper (ui)
      ├─ ArchiveCard (saved, not archived)
      ├─ aside ≥1024: SaveCard, ItemPreview      aside ≥1600: ItemPerformance
      ├─ SaveBar <1024
      ├─ Dialog (ui) "Live preview" > ItemPreview   (Preview button, <1024)
      └─ LeaveDialog
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/menu/item` | `loadMenuItemPage` → `MenuItemPage`, `UpcomingDay`, `ItemPerformance`, `NoticeRules` |
| `@/lib/menu/form` | `MenuItemValues`, `validate`, `changedFields`, `priceToPaise`, `slugify`, `LIMITS`, `QUANTITY`, `NOTICE`, photo limits |
| `@/lib/storefront/words` | `noticeChip` — the preview card's chip, the same words the customer's card uses |
| `@/lib/calendar/cutoffs` · `@/lib/dates` | `formatClock`, weekday / date labels — the notice line |
| `@/app/actions/menu` | `saveMenuItem` |
| `@/app/actions/cloudinary` | `getUploadSignature`, `deleteImage` (photos removed before they were ever saved) |
| `@/lib/cloudinary` | `uploadImage` (XHR, progress), `imageUrl` |
| `@/components/menu-actions/*` | provider, `MenuActionsStatus` — duplicate, archive, restore + undo |
| `@/hooks/useMenuActions` · `@/hooks/useDismiss` | action context · ⋯ menu dismissal |
| `@/components/ui/*` | `Button`, `Chip`, `Container`, `Dialog`, `Field`, `Notice`, `Stepper`, `Switch`, `Tag`, `TextInput`/`inputClasses`, icons |

External: `next/image` (blob and Cloudinary URLs, `unoptimized`), `next/link`, `next/navigation`. Tokens: `bg-o500` (Cover tag, unit and
chip selection, ring), `text-o700`, `bg-o50`, `border-red`/`bg-red-soft`/`text-red` (errors, allergens, archive), `bg-green-soft`/`text-green`,
`bg-sunken`, `rounded-panel/card/chip/pill`, `shadow-raised`, `pb-safe`, breakpoints `md`, `lg`, `2xl`.

## Props

```ts
AdminMenuItem     { dict: AdminCopy; page: MenuItemPage; justCreated: boolean }
MenuItemForm      { page; justCreated; dict }
ItemFormHeader    { title; status: "active" | "inactive" | null; onBack; onPreview; menu: ReactNode; dict: ItemCopy }
ItemFormMenu      { target: ItemTarget; dict }
ErrorSummary      { problems: Problem[]; dict }
ArchivedNotice    { id; name; archivedLabel; dict }
FormSection       { id; title; invalid?; children; className? }
BasicsSection     { form: ItemForm; categories; savedSlug: string | null; upcomingCount; dict: AdminCopy }
SlugLine          { slug; savedSlug; onChange; error?; dict: ItemCopy["basics"] }
CategoryPicker    { value: CategoryChoice; categories; onChange; error?; required; dict }
PriceField        { value; onChange; error?; required; dict }
UnitPicker        { value: PriceUnit; onChange; help; dict }
PhotosSection     { form; dict: ItemCopy }
CoverZone         { cover: PhotoDraft | null; onPick; onReplace; onFiles; onRemove; onRetry; dict }
GalleryGrid       { form; onPick; dict }
PhotoTile         { photo; index; dragging; handle; onRemove; onRetry; onSetCover; dict }
PhotoImage        { photo; width; ratio: "4:3" | "1:1" }
ProgressRing      { progress; label; size: "md" | "lg" }
AltTextList       { form; dict }
DetailsSection    { form; ingredientSuggestions; dict: AdminCopy }
AboutField        { value; onChange; dict: ItemCopy }
IngredientInput   { value: string[]; onChange; suggestions; dict }
AllergenPicker    { value: Allergen[]; onChange; dict: AdminCopy }
OrderingSection   { form; rules: NoticeRules; dict }
FulfilmentSection { form; dict }
ArchiveCard       { target: ItemTarget; dict }
SaveStatus / SaveCard / SaveBar { form; (creating;) dict }
SaveActions       { form; creating; dict: ItemCopy["save"] }
ItemPreview       { fields; cover: PhotoDraft | null; dict: AdminCopy }
ItemPerformance   { performance; upcoming; dict }
LeaveDialog       { changes; dict; onClose; onLeave }
```

## How it works

- **State** — `useItemForm` holds the typed fields, the photo drafts and the last-saved values. `changedFields` names what
  differs; that drives the status line, See changes, Discard, the leave dialog and the browser's
  beforeunload prompt.
- **Errors** — required fields and limits come from `validate` in `src/lib/menu/form.ts`; the server re-checks with zod. Field
  errors appear after the first Save attempt; photo problems (failed / still uploading) show at once. Save stays enabled until
  a refused attempt, then waits for the problems to clear.
- **Photos** — up to 6, index 0 is the cover. A pick or drop uploads straight to Cloudinary (`uploadImage`, signature from the
  server, refreshed every 30 min) with a progress ring; a wrong type or >10MB fails before uploading. Removing a photo that
  was uploaded but never saved destroys it; photos a save drops are destroyed by the action once no other item uses them.
  Alt text is stored alongside, in `MenuItem.imageAlts`.
- **Reorder** — `useReorder`: pointer events on a handle with `touch-none` (never long-press — it fights scroll on touch), and
  arrow keys on the focused handle.
- **Save** — creating: "Create item" goes to the new item's page (`?created=1`); "Save and add another" clears the form and
  stays. Editing: saves in place, "All changes saved" for 1.8s. A taken web address comes back as a field error naming the item.
  A typed category is created in the same transaction.
- **Duplicate / Archive / Restore** go through `menu-actions` (confirm, undo strip). The form remounts after archive or restore
  so it shows the item's new state; the provider (outside it) keeps the undo strip.
- **Ordering (7R)** — off → call only (on the menu with Call to order, never in a cart; the menu list tags it "Call only"). Notice
  0–7 days (the booking window; the DB allows 30 and the loader shows anything above 7 as 7). The line under the stepper is the
  deadline rule (`orders/deadline.ts`) applied to the Settings default cutoff: "Order by Friday 6pm for a Saturday pickup"; at 7 it
  names the first Saturday a customer could pick and its deadline date. "Bake each order separately" shows either way — the day
  sheet's Made to order rows. The notice is kept while ordering is off.
- **Lead time** from the old design is not built — the notice above is the order-ahead rule (§10R).
- **Last 30 days / Coming up** (≥1600, saved items) — orders and units from order lines; days on the counter and counter sold out
  (`soldOutAt`) from its counter-item rows; Coming up merges both by date from today ("24 made · 4 ordered").
  "View on site" waits for the customer item page (6.2).

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` | one column; Preview opens a bottom sheet; sticky save bar once there are changes; gallery 3 across |
| `md` (768, kitchen tablet) | form capped at 720px and centred; price/unit, size/storage paired; gallery 4 across |
| `lg` (1024) | form 5/8 + sticky right column (save card, live preview); Preview button and save bar go away; cover actions on hover |
| `2xl` (1600) | saved items: form 9/20 · preview 6/20 · performance 5/20; new items: 12/20 · 8/20 |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.menuItem`, `admin.allergens`, `admin.priceUnits` |
| A new field | `prisma/schema.prisma` + migration, `MenuItemValues`/`BLANK`/`changedFields` in `form.ts`, `loadMenuItemPage`, `saveInput` + `ItemRecord`, a control here, `fields` in the dict |
| A limit | `LIMITS` / `QUANTITY` / photo limits in `src/lib/menu/form.ts` (both sides read them) |

## Do not

- Store a Cloudinary URL — public_ids only, and only ones inside our folder (`isOurPublicId`).
- Delete an item from here — Archive (soft) only.
- Trust the browser's validation — `saveMenuItem` re-checks everything.
