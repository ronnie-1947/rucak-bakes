import { CustomerCard } from "./CustomerCard"
import { CustomerTable } from "./CustomerTable"
import { CustomerTableRow } from "./CustomerTableRow"
import type { AdminCopy, BoardCustomer } from "./types"

type CustomerBoardProps = {
  customers: BoardCustomer[]
  dict: AdminCopy
  /** The 2xl split pane is open — the list narrows to one column of cards beside it. */
  paneOpen: boolean
}

type Mode = "split" | "single"

/** Cards: one column on phones, two on the tablet; with the pane open, one column again at 2xl. */
const cardGrids: Record<Mode, string> = {
  split: "grid gap-3 md:grid-cols-2 lg:hidden 2xl:grid 2xl:grid-cols-1",
  single: "grid gap-3 md:grid-cols-2 lg:hidden",
}

/** The table from 1024px — until the pane takes the room at 2xl. */
const tables: Record<Mode, string> = {
  split: "hidden lg:block 2xl:hidden",
  single: "hidden lg:block",
}

/** Every layout is rendered and swapped by CSS — no resize logic. */
export function CustomerBoard({ customers, dict, paneOpen }: CustomerBoardProps) {
  const mode: Mode = paneOpen ? "split" : "single"
  return (
    <>
      <div className={cardGrids[mode]}>
        {customers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} dict={dict} />
        ))}
      </div>
      <div className={tables[mode]}>
        <CustomerTable dict={dict.customers}>
          {customers.map((customer) => (
            <CustomerTableRow key={customer.id} customer={customer} dict={dict} />
          ))}
        </CustomerTable>
      </div>
    </>
  )
}
