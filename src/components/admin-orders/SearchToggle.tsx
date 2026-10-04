import { Icon } from "@/components/ui/icons/Icon"

type SearchToggleProps = {
  /** "Search orders" */
  label: string
  /** Open from the start — a search is already in the URL. */
  open: boolean
}

/**
 * Under 768px: the 44px search button. A checkbox under the glyph — the header shows its search row while it's ticked
 * (`group-has-checked/search`), so no JavaScript is involved. From 768px the search row always shows and this goes away.
 */
export function SearchToggle({ label, open }: SearchToggleProps) {
  return (
    <label className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-button border border-border hover:bg-sunken has-checked:border-o500 has-checked:bg-o50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-o700 md:hidden">
      <input type="checkbox" defaultChecked={open} aria-label={label} className="sr-only" />
      <Icon name="search" className="size-4.5" />
    </label>
  )
}
