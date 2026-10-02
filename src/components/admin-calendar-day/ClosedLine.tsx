import { Icon } from "@/components/ui/icons/Icon"

type ClosedLineProps = {
  text: string
}

/** Above the item list while the day is closed: the list is resting, and this says why. */
export function ClosedLine({ text }: ClosedLineProps) {
  return (
    <p role="status" className="flex items-center gap-3 rounded-panel border border-border bg-sunken p-3 font-medium text-pretty tabular-nums">
      <Icon name="lock" className="size-4.5 shrink-0 text-muted" />
      {text}
    </p>
  )
}
