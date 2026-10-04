import { Button } from "@/components/ui/Button"

type ClearConfirmProps = {
  /** "Remove all 4 items?" */
  question: string
  keepLabel: string
  clearLabel: string
  onKeep: () => void
  onClear: () => void
}

/** Clear asks in place, under the heading — no dialog for something this easily redone. */
export function ClearConfirm({ question, keepLabel, clearLabel, onKeep, onClear }: ClearConfirmProps) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-2 rounded-panel bg-red-soft px-4 py-3">
      <span className="min-w-40 flex-1 font-medium text-red">{question}</span>
      <Button variant="outline" className="font-semibold" onClick={onKeep}>
        {keepLabel}
      </Button>
      <Button variant="dangerOutline" className="font-semibold" onClick={onClear}>
        {clearLabel}
      </Button>
    </div>
  )
}
