import Link from "next/link"
import { SignOutButton } from "@/components/admin-shell/SignOutButton"
import { Icon, type IconName } from "@/components/ui/icons/Icon"
import type { Dict } from "@/lib/i18n"

type AdminMoreProps = {
  dict: Dict["admin"]
}

/** Phones only reach Customers and Settings through here — the tab bar has room for five. */
export function AdminMore({ dict }: AdminMoreProps) {
  const links: { href: string; icon: IconName; label: string; hint: string }[] = [
    { href: "/admin/customers", icon: "customers", label: dict.nav.customers, hint: dict.more.customersHint },
    { href: "/admin/settings", icon: "settings", label: dict.nav.settings, hint: dict.more.settingsHint },
  ]
  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <h1 className="text-h1">{dict.more.title}</h1>
      <ul className="flex flex-col overflow-hidden rounded-panel border border-border">
        {links.map((link) => (
          <li key={link.href} className="border-b border-border">
            <Link href={link.href} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-sunken">
              <Icon name={link.icon} className="size-5 text-muted" />
              <span className="flex flex-1 flex-col">
                <span className="font-semibold">{link.label}</span>
                <span className="text-small-admin text-muted">{link.hint}</span>
              </span>
              <Icon name="chevronRight" className="size-5 text-subtle" />
            </Link>
          </li>
        ))}
        <li>
          <SignOutButton label={dict.shell.signOut} tone="list" />
        </li>
      </ul>
    </div>
  )
}
