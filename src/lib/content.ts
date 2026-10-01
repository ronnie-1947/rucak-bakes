import { defaultLocale, type Locale, locales } from "@/lib/i18n"

/**
 * The URL for `route` in `locale`.
 *
 * The source locale owns the bare route; every other locale is a literal
 * trailing segment. Homepages are the special case — "/" becomes "/<locale>"
 * rather than "//<locale>".
 *
 *   localePath("en", "/pricing") === "/pricing"      (en is the source locale)
 *   localePath("fr", "/pricing") === "/pricing/fr"
 *   localePath("fr", "/")        === "/fr"
 */
export function localePath(locale: Locale, route: string): string {
  if (locale === defaultLocale) return route
  return route === "/" ? `/${locale}` : `${route}/${locale}`
}

/**
 * Every locale's URL for one page, for the language switcher and for
 * `alternates.languages` in page metadata.
 *
 * Always takes the SOURCE-LOCALE path — pass "/pricing", never "/pricing/fr".
 */
export function localeAlternates(route: string): Record<Locale, string> {
  return Object.fromEntries(locales.map((locale) => [locale, localePath(locale, route)])) as Record<Locale, string>
}

/**
 * BCP-47 tag for a locale, for `lang` attributes.
 *
 * Only a root layout may render <html>, so it can declare one language — the
 * source locale's. Every page therefore re-declares its own on its outermost
 * element: <div lang={htmlLang(locale)} className="contents">
 *
 * Add a region subtag here when a locale needs one ("pt" -> "pt-BR").
 */
export function htmlLang(locale: Locale): string {
  return locale
}
