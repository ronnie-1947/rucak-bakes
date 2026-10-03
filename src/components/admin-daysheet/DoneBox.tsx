import { CheckIcon } from "@/components/ui/icons/CheckIcon"

type DoneBoxProps = {
  done: boolean
  onToggle: () => void
  /** The row's name in words — "Sourdough loaf baked", "Meera Iyer collected". */
  label: string
  disabled: boolean
}

const boxes: Record<"done" | "open", string> = {
  done: "border-green bg-green",
  open: "border-border-strong bg-background",
}

/** The day sheet's tick: a 28px square in a 44px target — big enough to hit with floury hands. Green, never colour alone: the row says "Done". */
export function DoneBox({ done, onToggle, label, disabled }: DoneBoxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className="grid size-11 shrink-0 place-items-center rounded-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 disabled:cursor-default"
    >
      <span className={`grid size-7 place-items-center rounded-chip border-2 text-background ${boxes[done ? "done" : "open"]}`}>
        {done ? <CheckIcon className="size-4.5" /> : null}
      </span>
    </button>
  )
}
