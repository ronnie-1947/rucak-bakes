import type { IconName } from "@/components/ui/icons/Icon"
import type { SettingsPageData } from "@/lib/settings/queries"
import { type SettingsSection, sectionHref, settingsSections } from "@/lib/settings/sections"
import { sectionSummary } from "./copy"
import { SectionLink } from "./SectionLink"
import type { AdminCopy } from "./types"

type SectionListProps = {
  data: SettingsPageData
  dict: AdminCopy
  className?: string
}

const icons: Record<SettingsSection, IconName> = {
  bakery: "store",
  ordering: "orders",
  notifications: "bell",
  staff: "customers",
  appearance: "image",
}

/**
 * "Settings" and the five sections. On phones it's the whole screen until a section is opened, each entry
 * saying where things stand ("Telegram needs attention" in red); from 768px it sticks beside the pane.
 */
export function SectionList({ data, dict, className }: SectionListProps) {
  const d = dict.settings
  return (
    <nav aria-labelledby="settings-title" className={`flex-col gap-3 md:sticky md:top-6 lg:top-8 ${className ?? ""}`}>
      <h1 id="settings-title" className="text-h1">
        {d.title}
      </h1>
      <ul className="flex flex-col gap-2 md:gap-1">
        {settingsSections.map((section) => (
          <li key={section}>
            <SectionLink
              href={sectionHref(section)}
              title={d.sections[section].title}
              summary={sectionSummary(section, data, dict)}
              icon={icons[section]}
              current={section === data.active}
              dirtyLabel={d.unsavedDot}
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}
