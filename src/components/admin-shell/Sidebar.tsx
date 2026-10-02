import { fill } from "@/lib/template"
import { sidebarNav } from "./nav"
import { NavLink } from "./NavLink"
import { SignOutButton } from "./SignOutButton"
import type { AdminCopy, ShellData } from "./types"

type SidebarProps = {
  dict: AdminCopy
  data: ShellData
}

/** From 768px: 220px ink column — bakery, today, every screen, then who is signed in. */
export function Sidebar({ dict, data }: SidebarProps) {
  return (
    <nav aria-label={dict.shell.navLabel} className="hidden w-55 shrink-0 flex-col gap-6 overflow-y-auto bg-sidebar px-3 py-4 text-background md:flex">
      <div className="flex flex-col px-2">
        <span className="font-display text-h2 font-semibold">{data.bakeryName}</span>
        <span className="text-small-admin text-subtle">{data.todayLabel}</span>
      </div>

      <ul className="flex flex-col gap-1">
        {sidebarNav.map((item) => (
          <li key={item.key}>
            <NavLink
              href={item.href}
              label={dict.nav[item.key]}
              icon={item.icon}
              match={item.match}
              variant="sidebar"
              badge={item.key === "orders" ? data.pendingCount : undefined}
              badgeLabel={fill(dict.shell.pendingBadge, { count: data.pendingCount })}
            />
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-1 border-t border-background/10 pt-4">
        <span className="px-3 text-small-admin text-subtle">{fill(dict.shell.signedInAs, { name: data.staffName })}</span>
        <SignOutButton label={dict.shell.signOut} tone="sidebar" />
      </div>
    </nav>
  )
}
