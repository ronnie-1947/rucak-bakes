import type { ReactNode } from "react"

type StepLayoutProps = {
  main: ReactNode
  /** The sticky summary card — shown from 1024px only; below that its parts sit in `main` and the ActionBar. */
  side: ReactNode
}

/** One column to 1024px; then 3 : 2 with the summary card sticking under the header while the lines scroll. */
export function StepLayout({ main, side }: StepLayoutProps) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-5 lg:gap-12">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-3">{main}</div>
      <aside className="hidden flex-col gap-4 rounded-card border border-border p-4 lg:sticky lg:top-21 lg:col-span-2 lg:flex">{side}</aside>
    </div>
  )
}
