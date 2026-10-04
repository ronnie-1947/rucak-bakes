import { Button } from "@/components/ui/Button"

type TooSoonFlagProps = {
  /** "Needs 3 days’ notice — too soon for Saturday". */
  text: string
  removeLabel: string
  /** "Remove Custom birthday cake". */
  removeAria: string
  onRemove: () => void
  /** "Move to Tuesday", or "Choose another day" when no date takes every line. */
  moveLabel: string
  onMove: () => void
}

/** Under a cart line its notice makes too soon for the cart's day: what's wrong, and the two ways out. Continue still works. */
export function TooSoonFlag({ text, removeLabel, removeAria, onRemove, moveLabel, onMove }: TooSoonFlagProps) {
  return (
    <div role="alert" className="flex flex-col gap-1 rounded-button border border-red bg-red-soft px-3 pt-2 pb-1">
      <span className="text-small font-semibold text-pretty text-red">{text}</span>
      <div className="flex flex-wrap gap-x-2">
        <Button variant="ghost" size="inline" onClick={onRemove} aria-label={removeAria} className="px-1 font-semibold">
          {removeLabel}
        </Button>
        <Button variant="link" size="inline" onClick={onMove} className="px-1">
          {moveLabel}
        </Button>
      </div>
    </div>
  )
}
