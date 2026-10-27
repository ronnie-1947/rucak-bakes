import { requireStaff } from "@/auth"
import { AdminShell } from "@/components/admin-shell/AdminShell"
import { htmlLang } from "@/lib/content"
import { getDictionary, type Locale } from "@/lib/i18n"
import { loadShellData } from "./shell-data"

const locale: Locale = "en"

/**
 * Every signed-in admin screen. requireStaff() re-checks the staff row on every render — the proxy's
 * check is optimistic, and a JWT outlives a deactivation. The login screen sits outside this group. The shell's own reads
 * run alongside it rather than after: a signed-out request still redirects before anything renders.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [staff, dict, data] = await Promise.all([requireStaff(), getDictionary(locale), loadShellData()])

  return (
    <div lang={htmlLang(locale)} className="contents">
      <AdminShell dict={dict.admin} data={{ ...data, staffName: staff.name }}>
        {children}
      </AdminShell>
    </div>
  )
}
