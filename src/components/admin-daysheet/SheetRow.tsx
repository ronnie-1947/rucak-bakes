import type { ReactNode } from "react"

type SheetRowProps = {
  /** Ticked — the row goes green and its quantity is struck through. */
  done: boolean
  /** The big number — read from a metre away. */
  quantity: number
  /** Under the quantity: "+ 2 pending". */
  below?: ReactNode
  /** The middle column: name, unit line, who, notes. */
  children: ReactNode
  /** The DoneBox, or nothing when the row can't be ticked. */
  tick: ReactNode
}

type State = "done" | "open"

const rows: Record<State, string> = {
  done: "bg-green-soft",
  open: "bg-background",
}

const quantities: Record<State, string> = {
  done: "text-green line-through",
  open: "text-foreground",
}

/** One bake row of the sheet — For orders, Made to order and Counter-items share it: quantity, what it is, the tick. */
export function SheetRow({ done, quantity, below, children, tick }: SheetRowProps) {
  const state: State = done ? "done" : "open"
  return (
    <li
      className={`grid min-h-18 grid-cols-[4.5rem_minmax(0,1fr)_2.75rem] items-center gap-3 border-b border-border px-2 py-3 md:grid-cols-[5.5rem_minmax(0,1fr)_2.75rem] ${rows[state]}`}
    >
      <span className="flex flex-col items-start tabular-nums">
        <span className={`text-glance font-semibold md:text-glance-lg ${quantities[state]}`}>{quantity}</span>
        {below}
      </span>
      <span className="flex min-w-0 flex-col">{children}</span>
      {tick ?? <span />}
    </li>
  )
}
