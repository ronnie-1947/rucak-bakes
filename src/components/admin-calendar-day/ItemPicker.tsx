import { Button } from "@/components/ui/Button"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { Chip } from "@/components/ui/Chip"
import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/icons/Icon"
import { TextInput } from "@/components/ui/TextInput"
import type { DayEditorData, EditorItem } from "@/lib/calendar/day"
import { fill } from "@/lib/template"
import { ItemGroup } from "./ItemGroup"
import { PlanStrip } from "./PlanStrip"
import type { AdminCopy } from "./types"
import type { DayEditor } from "./useDayEditor"

type ItemPickerProps = {
  data: DayEditorData
  editor: DayEditor
  dict: AdminCopy
}

const OTHER = "__other"

/**
 * "Items on this day": Select all / Clear all, a search and category chips (both just narrow the list — they
 * don't change the plan), then the menu grouped by category. Every item the bakery sells is listed; ticked
 * ones are on sale that day.
 */
export function ItemPicker({ data, editor, dict }: ItemPickerProps) {
  const d = dict.calendarDay.items
  const known = new Set(data.categories.map((category) => category.slug))
  const groupOf = (item: EditorItem) => (item.categorySlug && known.has(item.categorySlug) ? item.categorySlug : OTHER)
  const q = editor.query.trim().toLowerCase()
  const visible = data.items.filter((item) => (editor.category === null || groupOf(item) === editor.category) && (!q || item.name.toLowerCase().includes(q)))
  const groups = [...data.categories, { slug: OTHER, name: d.uncategorised }]
    .map((category) => ({ ...category, all: data.items.filter((item) => groupOf(item) === category.slug) }))
    .map((category) => ({ ...category, items: visible.filter((item) => groupOf(item) === category.slug) }))
    .filter((category) => category.items.length > 0)
  const chips = [...data.categories, ...(data.items.some((item) => groupOf(item) === OTHER) ? [{ slug: OTHER, name: d.uncategorised }] : [])]
  const ids = visible.map((item) => item.id)

  return (
    <section aria-labelledby="items-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="items-title" className="text-h2">
          {d.title}
        </h2>
        <div className="flex gap-1">
          <Button variant="link" size="sm" className="px-2" onClick={() => editor.setAll(ids, true)}>
            {d.selectAll}
          </Button>
          <Button variant="link" size="sm" className="px-2" onClick={() => editor.setAll(ids, false)}>
            {d.clearAll}
          </Button>
        </div>
      </div>

      <label className="relative block">
        <span className="sr-only">{d.searchLabel}</span>
        <Icon name="search" className="pointer-events-none absolute top-3 left-3 size-5 text-muted" />
        <TextInput type="search" value={editor.query} onChange={(event) => editor.setQuery(event.target.value)} placeholder={d.searchPlaceholder} className="pl-10" />
      </label>

      {chips.length > 1 ? (
        <div role="group" aria-label={d.categoryLabel} className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          <Chip selected={editor.category === null} onClick={() => editor.setCategory(null)}>
            {d.allCategories}
          </Chip>
          {chips.map((category) => (
            <Chip key={category.slug} selected={editor.category === category.slug} onClick={() => editor.setCategory(category.slug)}>
              {category.name}
            </Chip>
          ))}
        </div>
      ) : null}

      <PlanStrip editor={editor} dict={dict} />

      {data.items.length === 0 ? (
        <EmptyState
          message={d.emptyMenu}
          action={
            <ButtonLink href="/admin/menu/new" variant="primary">
              {d.addItems}
            </ButtonLink>
          }
        />
      ) : groups.length === 0 ? (
        <EmptyState message={fill(d.noMatch, { q: editor.query.trim() })} />
      ) : (
        groups.map((group) => <ItemGroup key={group.slug} name={group.name} items={group.items} all={group.all} editor={editor} dict={d} />)
      )}
    </section>
  )
}
