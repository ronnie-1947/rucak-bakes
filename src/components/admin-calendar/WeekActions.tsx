import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import type { CalendarCopy } from "./types"

type Layout = "wide" | "narrow"

type WeekActionsProps = {
  layout: Layout
  applyOpen: boolean
  onCopy: () => void
  onApply: () => void
  dict: CalendarCopy
}

const wrappers: Record<Layout, string> = {
  /** Beside the title from 768px. */
  wide: "hidden items-center gap-2 md:flex",
  /** Phones: Copy last week full width, Apply to all days under it. */
  narrow: "flex flex-col items-start gap-1 md:hidden",
}

const copyButtons: Record<Layout, string> = {
  wide: "",
  narrow: "w-full",
}

/** Copy last week and Apply to all days. Rendered once per layout; CSS shows the one that fits. */
export function WeekActions({ layout, applyOpen, onCopy, onApply, dict }: WeekActionsProps) {
  return (
    <div className={wrappers[layout]}>
      {layout === "wide" ? (
        <Button variant="link" size="sm" aria-expanded={applyOpen} onClick={onApply}>
          {dict.applyAll}
        </Button>
      ) : null}
      <Button variant="outlineLink" className={copyButtons[layout]} onClick={onCopy}>
        <Icon name="copy" className="size-4.5" />
        <span>{dict.copyLastWeek}</span>
      </Button>
      {layout === "narrow" ? (
        <Button variant="link" size="inline" className="px-1" aria-expanded={applyOpen} onClick={onApply}>
          {dict.applyAll}
        </Button>
      ) : null}
    </div>
  )
}
