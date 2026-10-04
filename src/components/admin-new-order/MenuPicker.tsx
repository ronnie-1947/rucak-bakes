import { useId } from "react"
import { Chip } from "@/components/ui/Chip"
import { Icon } from "@/components/ui/icons/Icon"
import { fill } from "@/lib/template"
import { MenuPickRow } from "./MenuPickRow"
import type { FormCopy } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type MenuPickerProps = {
  form: NewOrderForm
  dict: FormCopy
}

/** "Add from the menu": every item still on the menu, narrowed by a search and a category chip — in the page, no URL state. */
export function MenuPicker({ form, dict }: MenuPickerProps) {
  const searchId = useId()
  const t = dict.newOrder.items
  const q = form.query.trim().toLowerCase()
  const shown = form.page.items.filter(
    (item) => (form.category === null || item.category === form.category) && (!q || item.name.toLowerCase().includes(q)),
  )
  const added = new Set(form.lines.map((line) => line.id))

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <span className="text-micro font-semibold text-muted uppercase">{t.pickerTitle}</span>
      <label htmlFor={searchId} className="relative block">
        <span className="sr-only">{t.search}</span>
        <Icon name="search" className="pointer-events-none absolute top-3 left-3 size-5 text-muted" />
        <input
          id={searchId}
          type="search"
          value={form.query}
          placeholder={t.search}
          enterKeyHint="search"
          onChange={(event) => form.setQuery(event.target.value)}
          className="h-11 w-full rounded-field border border-border bg-background pr-3 pl-10 text-body text-foreground placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 md:text-body-admin"
        />
      </label>
      {form.page.categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Chip selected={form.category === null} onClick={() => form.setCategory(null)}>
            {t.all}
          </Chip>
          {form.page.categories.map((category) => (
            <Chip key={category.slug} selected={form.category === category.slug} onClick={() => form.setCategory(category.slug)}>
              {category.name}
            </Chip>
          ))}
        </div>
      ) : null}
      {shown.length === 0 ? (
        <p className="rounded-panel bg-sunken p-4 text-small-admin text-muted">{fill(t.noMatch, { q: form.query.trim() })}</p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((item) => (
            <MenuPickRow key={item.id} item={item} added={added.has(item.id)} onAdd={() => form.addItem(item)} dict={dict} />
          ))}
        </ul>
      )}
    </div>
  )
}
