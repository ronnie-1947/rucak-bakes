import { CheckIcon } from "@/components/ui/icons/CheckIcon"
import { CloseIcon } from "@/components/ui/icons/CloseIcon"

type FlashLineProps = {
  text: string
  dismissLabel: string
  onDismiss: () => void
}

/** The green line a week-wide change leaves — "Copied Mon 28 Sep – Sun 4 Oct into 5 days". Stays until dismissed. */
export function FlashLine({ text, dismissLabel, onDismiss }: FlashLineProps) {
  return (
    <div role="status" className="flex items-center gap-2 rounded-panel bg-green-soft pl-3">
      <CheckIcon className="size-4 shrink-0 text-green" />
      <span className="min-w-0 flex-1 text-small-admin font-semibold text-green tabular-nums">{text}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        className="grid size-11 shrink-0 place-items-center rounded-button text-green focus-visible:outline-2 focus-visible:outline-o700"
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  )
}
