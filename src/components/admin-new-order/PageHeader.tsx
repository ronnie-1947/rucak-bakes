import { Icon } from "@/components/ui/icons/Icon"
import type { NewOrderCopy } from "./types"

type PageHeaderProps = {
  onBack: () => void
  dict: NewOrderCopy
}

/** The intro line on every width; from 768px with an outlined back button and the title (phones have them in TopBar). */
export function PageHeader({ onBack, dict }: PageHeaderProps) {
  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        onClick={onBack}
        aria-label={dict.back}
        className="hidden size-11 shrink-0 place-items-center rounded-button border border-border hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700 md:grid"
      >
        <Icon name="chevronLeft" className="size-5" />
      </button>
      <div className="flex min-w-0 flex-col md:pt-1">
        <h1 className="hidden text-h1 md:block">{dict.title}</h1>
        <p className="text-small text-pretty text-muted">{dict.intro}</p>
      </div>
    </div>
  )
}
