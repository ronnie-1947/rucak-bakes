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
 * content.
 */
export function AdminShell({ dict, data, children }: AdminShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-body-admin">
      <Sidebar dict={dict} data={data} />
      <div className="flex min-w-0 flex-1 flex-col">
        {data.bypassed ? (
          <p role="status" className="shrink-0 bg-o50 px-4 py-1 text-center text-small-admin text-o700">
            {fill(dict.shell.bypass, { name: data.staffName })}
          </p>
        ) : null}
        <MobileHeader dict={dict} data={data} />
        <main id="admin-main" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>
        <TabBar dict={dict} pendingCount={data.pendingCount} />
      </div>
    </div>
  )
}
