import { fill } from "@/lib/template"
import { tabNav } from "./nav"
import { NavLink } from "./NavLink"
import type { AdminCopy } from "./types"

type TabBarProps = {
  dict: AdminCopy
  pendingCount: number
}

/** Under 768px: five tabs at the bottom, clear of the home indicator. */
export function TabBar({ dict, pendingCount }: TabBarProps) {
  return (
    <nav aria-label={dict.shell.navLabel} className="shrink-0 border-t border-border bg-background px-1 pt-1 pb-safe md:hidden print:hidden">
      <ul className="grid grid-cols-5">
        {tabNav.map((item) => (
          <li key={item.key}>
            <NavLink
              href={item.href}
              label={dict.nav[item.key]}
              icon={item.icon}
              match={item.match}
              variant="tab"
              badge={item.key === "orders" ? pendingCount : undefined}
              badgeLabel={fill(dict.shell.pendingBadge, { count: pendingCount })}
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}
