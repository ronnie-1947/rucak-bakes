import { AdminLoading } from "@/components/admin-shell/AdminLoading"
import { getDictionary, type Locale } from "@/lib/i18n"

const locale: Locale = "en"

/**
 * Shown in `main` the moment a screen is opened, while its data loads — without it a dynamic route has nothing to
 * prefetch and the click hangs on the old screen. Sections with nested screens re-export this from their own folder,
 * so moving within one (Orders → an order) shows it too.
 */
export default async function AdminShellLoading() {
  const dict = await getDictionary(locale)
  return <AdminLoading label={dict.admin.shell.loading} />
}
