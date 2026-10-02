import type { ReactNode } from "react"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import type { ItemCopy } from "./types"

type ItemFormHeaderProps = {
  title: string
  /** The saved item's state; null while creating. */
  status: "active" | "inactive" | null
  onBack: () => void
  onPreview: () => void
  /** The ⋯ menu — saved items only. */
  menu: ReactNode
  dict: ItemCopy
}

const badges: Record<"active" | "inactive", string> = {
  active: "bg-green-soft text-green",
  inactive: "bg-red-soft text-red",
}

const dots: Record<"active" | "inactive", string> = {
  active: "bg-green",
  inactive: "bg-red",
}

/** Back, the item's name with its saved Active / Inactive badge, Preview (below 1024px) and the ⋯ menu. */
export function ItemFormHeader({ title, status, onBack, onPreview, menu, dict }: ItemFormHeaderProps) {
  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        onClick={onBack}
        aria-label={dict.back}
        className="grid size-11 shrink-0 place-items-center rounded-button hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
      >
        <Icon name="chevronLeft" className="size-5.5" />
      </button>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 pt-2">
        <h1 className="text-h1 break-words">{title}</h1>
        {status ? (
          <span className={`inline-flex items-center gap-2 rounded-chip px-2 text-micro font-semibold ${badges[status]}`}>
            <span aria-hidden className={`size-1.5 rounded-pill ${dots[status]}`} />
            {status === "active" ? dict.active : dict.inactive}
          </span>
        ) : null}
      </div>
      <Button variant="link" size="sm" className="shrink-0 lg:hidden" onClick={onPreview}>
        {dict.preview}
      </Button>
      {menu}
    </div>
  )
}
