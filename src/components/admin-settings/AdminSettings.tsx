import { Container } from "@/components/ui/Container"
import { Notice } from "@/components/ui/Notice"
import type { SettingsPageData } from "@/lib/settings/queries"
import { sectionHref } from "@/lib/settings/sections"
import { LeaveGuard } from "./LeaveGuard"
import { SectionHeader } from "./SectionHeader"
import { SectionList } from "./SectionList"
import { SettingsPane } from "./SettingsPane"
import type { AdminCopy } from "./types"

type AdminSettingsProps = {
  dict: AdminCopy
  data: SettingsPageData
}

type Mode = "list" | "section"

/** Phones show one or the other — the list, or the section opened from it. From 768px both, side by side. */
const lists: Record<Mode, string> = {
  list: "flex",
  section: "hidden md:flex",
}

const panes: Record<Mode, string> = {
  list: "hidden md:flex",
  section: "flex",
}

/**
 * /admin/settings — the section list and one section, chosen by `?section=`. List 200px on the kitchen
 * tablet, 240px from 1024px. Each section saves on its own; the LeaveGuard asks before unsaved changes are
 * left behind. Staff see everything with the controls switched off.
 */
export function AdminSettings({ dict, data }: AdminSettingsProps) {
  const d = dict.settings
  const mode: Mode = data.section ? "section" : "list"
  const section = d.sections[data.active]

  return (
    <LeaveGuard sectionTitle={section.title} dict={d.leave}>
      <Container className="grid min-h-full items-start gap-6 pt-4 md:grid-cols-[12.5rem_minmax(0,1fr)] md:pt-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:pt-8">
        <SectionList data={data} dict={dict} className={`pb-8 ${lists[mode]}`} />
        <div className={`min-h-full min-w-0 flex-col gap-4 ${panes[mode]}`}>
          <SectionHeader title={section.title} intro={section.intro} backHref={sectionHref(null)} backLabel={d.back} />
          {data.canEdit ? null : <Notice tone="warm">{d.readOnly}</Notice>}
          <SettingsPane key={data.active} data={data} dict={d} />
        </div>
      </Container>
    </LeaveGuard>
  )
}
