import type en from "@/content/en.json"

export const locales = ["en"] as const

export type Locale = (typeof locales)[number]

/** The locale that owns the bare route. Every other locale gets a trailing segment. */
export const defaultLocale: Locale = "en"

/** The shape every locale file must match. The source locale's file defines it. */
export type Dict = typeof en

const dictionaries: Record<Locale, () => Promise<Dict>> = {
  en: () => import("@/content/en.json").then((m) => m.default as Dict),
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

/**
 * Load a locale's dictionary. Resolved at build time — there is no runtime fetch.
 * Keep this name stable: every scaffolding command reads it from this file rather
 * than assuming one, but renaming it after the fact means editing every page.
 */
export async function getDictionary(locale: Locale): Promise<Dict> {
  return dictionaries[locale]()
}
