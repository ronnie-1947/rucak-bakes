import { Button } from "@/components/ui/Button"

type DayCardProps = {
  /** "Pickup day" / "Delivery day". */
  label: string
  /** "Saturday, 10 Oct". */
  title: string
  /** "Order by 6pm Friday · 9 of 15 orders left", or why the day can't take the order. */
  meta: string
  /** Change day — left off once the order is being placed. */
  change?: { label: string; onClick: () => void; disabled?: boolean }
}

/** The day the whole cart is for, on the warm o500 fill with ink text — the one large fill on the page. */
export function DayCard({ label, title, meta, change }: DayCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-card bg-o500 p-4 text-foreground">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <span className="text-micro font-semibold uppercase">{label}</span>
        {change ? (
          <Button variant="underline" size="inline" onClick={change.onClick} disabled={change.disabled} className="-my-3">
            {change.label}
          </Button>
        ) : null}
      </div>
      <p className="font-display text-h1 font-semibold">{title}</p>
      <p className="text-small text-pretty tabular-nums">{meta}</p>
    </div>
  )
}
