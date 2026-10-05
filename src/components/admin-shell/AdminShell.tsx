import type { ReactNode } from "react"
import { fill } from "@/lib/template"
import { MobileHeader } from "./MobileHeader"
import { Sidebar } from "./Sidebar"
import { TabBar } from "./TabBar"
import type { AdminCopy, ShellData } from "./types"

type AdminShellProps = {
  dict: AdminCopy
  data: ShellData
  children: ReactNode
}

/**
 * The frame around every signed-in admin screen. The shell is exactly one viewport tall and `main`
 * is the scroll container — so a screen's sticky bars stick inside it, and the tab bar never covers
 * content. `main` is `relative` so it is also the containing block: an `sr-only` radio or legend deep in a long form
 * would otherwise be placed against the page root, escape main's clip, and make the document itself scroll — sliding
 * the whole shell up and leaving blank page under the tab bar.
 */
export function AdminShell({ dict, data, children }: AdminShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-body-admin print:block print:h-auto print:overflow-visible">
      <Sidebar dict={dict} data={data} />
      <div className="flex min-w-0 flex-1 flex-col print:block">
        {data.bypassed ? (
          <p role="status" className="shrink-0 bg-o50 px-4 py-1 text-center text-small-admin text-o700 print:hidden">
            {fill(dict.shell.bypass, { name: data.staffName })}
          </p>
        ) : null}
        <MobileHeader dict={dict} data={data} />
        <main id="admin-main" className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain print:overflow-visible">
          {children}
        </main>
        <TabBar dict={dict} pendingCount={data.pendingCount} />
      </div>
    </div>
  )
}
