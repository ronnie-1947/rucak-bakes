import { StoreShell } from "@/components/store-shell/StoreShell"
import { htmlLang } from "@/lib/content"
import { getDictionary, type Locale } from "@/lib/i18n"
import { loadStoreShell } from "@/lib/storefront/shell"

const locale: Locale = "en"

/** Every customer screen — landing, item page, cart: the banner, header and cart around them. No sign-in. */
export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [dict, data] = await Promise.all([getDictionary(locale), loadStoreShell()])

  return (
    <div lang={htmlLang(locale)} className="contents">
      <StoreShell data={data} dict={dict.store}>
        {children}
      </StoreShell>
    </div>
  )
}
