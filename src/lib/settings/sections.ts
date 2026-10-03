/**
 * The settings screen's sections and its one piece of URL state, `?section=`. With none, phones show the
 * section list and wider screens open Bakery details beside it. Client-safe.
 */

export const settingsSections = ["bakery", "ordering", "notifications", "staff", "appearance"] as const

export type SettingsSection = (typeof settingsSections)[number]

export const SETTINGS_PATH = "/admin/settings"

/** What the tablet and desktop open when no section is named. */
export const FIRST_SECTION: SettingsSection = "bakery"

function isSection(value: string): value is SettingsSection {
  return (settingsSections as readonly string[]).includes(value)
}

/** `?section=` → a section, or null for anything missing or unknown. */
export function parseSection(value: string | string[] | undefined): SettingsSection | null {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && isSection(raw) ? raw : null
}

/** Null is the bare path — the list on phones. */
export function sectionHref(section: SettingsSection | null): string {
  return section ? `${SETTINGS_PATH}?section=${section}` : SETTINGS_PATH
}
