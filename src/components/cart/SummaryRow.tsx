import { Button } from "@/components/ui/Button"

type SummaryRowProps = {
  /** "3 items · ₹660 · Saturday, 10 Oct". */
  text: string
  editLabel: string
  onEdit: () => void
}

/** The cart in one line at the top of the details step, with Edit back to it. */
export function SummaryRow({ text, editLabel, onEdit }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-button border border-border py-1 pr-1 pl-4">
      <span className="py-2 text-pretty tabular-nums">{text}</span>
      <Button variant="link" onClick={onEdit}>
        {editLabel}
      </Button>
    </div>
  )
}
