import { Icon } from "@/components/ui/icons/Icon"
import type { NewOrderCopy } from "./types"

type TopBarProps = {
  onBack: () => void
  dict: NewOrderCopy
}

/** Under 768px: back and "New order", stuck to the top of the scroll area while the form scrolls under it. */
export function TopBar({ onBack, dict }: TopBarProps) {
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center gap-1 border-b border-border bg-background px-2 md:hidden">
      <button
        type="button"
        onClick={onBack}
        aria-label={dict.back}
        className="grid size-11 shrink-0 place-items-center rounded-button hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
      >
        <Icon name="chevronLeft" className="size-5.5" />
      </button>
      <h1 className="text-h2">{dict.title}</h1>
    </div>
  )
}
