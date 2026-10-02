import { CheckIcon } from "@/components/ui/icons/CheckIcon"

type SelectBoxProps = {
  checked: boolean
  onChange: () => void
  /** "Select BK-1004" */
  label: string
  /** `cover`: the input stretches over its positioned ancestor, so the whole card toggles. */
  cover?: boolean
}

const hitAreas: Record<"cover" | "box", string> = {
  cover: "absolute inset-0 z-10 cursor-pointer rounded-panel",
  box: "absolute -inset-3 cursor-pointer",
}

/** Unpositioned in cover mode, so the input's `inset-0` reaches the card (the nearest positioned ancestor). */
const wrappers: Record<"cover" | "box", string> = {
  cover: "flex size-5 shrink-0 items-center justify-center",
  box: "relative flex size-5 shrink-0 items-center justify-center",
}

/** The bulk-selection tick. A real checkbox (keyboard, screen readers) with the design's 22px box drawn beside it. */
export function SelectBox({ checked, onChange, label, cover = false }: SelectBoxProps) {
  return (
    <span className={wrappers[cover ? "cover" : "box"]}>
      <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} className={`peer appearance-none ${hitAreas[cover ? "cover" : "box"]}`} />
      <span
        aria-hidden
        className="pointer-events-none flex size-5 items-center justify-center rounded-chip border-2 border-border-strong bg-background text-background peer-checked:border-o700 peer-checked:bg-o700 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-o700"
      >
        <CheckIcon className="size-3.5" />
      </span>
    </span>
  )
}
