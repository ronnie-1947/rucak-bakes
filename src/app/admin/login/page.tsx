import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getStaff } from "@/auth"
import { AdminLogin } from "@/components/admin-login/AdminLogin"
import { adminSectionOf, safeAdminPath } from "@/lib/admin-routes"
import { htmlLang } from "@/lib/content"
import { getDictionary, type Locale } from "@/lib/i18n"
import { formatForDisplay } from "@/lib/phone"
import { findSettings } from "@/lib/settings"
import { firstParam, loginStateOf } from "./login-state"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: dict.admin.login.metaTitle, robots: { index: false, follow: false } }
}

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams
  const callbackUrl = safeAdminPath(firstParam(params.callbackUrl))

  // Already signed in (and still on the allowlist): go where they were headed.
  if (await getStaff()) redirect(callbackUrl)

  const [dict, settings] = await Promise.all([getDictionary(locale), findSettings()])
  const section = adminSectionOf(callbackUrl)
  const publicPhone = settings?.publicPhone

  return (
    <div lang={htmlLang(locale)} className="contents">
      <AdminLogin
        dict={dict.admin.login}
        bakeryName={settings?.bakeryName ?? dict.meta.home.title}
        ownerPhone={publicPhone ? { e164: publicPhone, display: formatForDisplay(publicPhone) } : null}
        state={loginStateOf(firstParam(params.error), firstParam(params.reason))}
        email={firstParam(params.email) ?? null}
        destination={section ? dict.admin.nav[section] : dict.admin.login.expiredFallback}
        callbackUrl={callbackUrl}
      />
    </div>
  )
}
