import type { SettingsPageData } from "@/lib/settings/queries"
import { fullRow } from "./layout"
import { PaneGrid } from "./PaneGrid"
import { TelegramCard } from "./TelegramCard"
import { TelegramPreview } from "./TelegramPreview"
import type { SettingsCopy } from "./types"

type NotificationsSectionProps = {
  data: SettingsPageData
  dict: SettingsCopy
}

/**
 * Order alerts on Telegram. Nothing here waits for a Save — connecting, testing and disconnecting act at
 * once — so there's no save bar. The card is keyed by its state, so a change resets its local steps and notes.
 */
export function NotificationsSection({ data, dict }: NotificationsSectionProps) {
  const t = dict.telegram
  return (
    <PaneGrid
      canEdit={data.canEdit}
      where="phone"
      dict={dict.preview}
      preview={<TelegramPreview bakeryName={data.bakery.bakeryName} connected={data.telegram.kind === "on"} dict={dict.preview} />}
    >
      <div className={`flex min-w-0 flex-col gap-2 ${fullRow}`}>
        <span className="text-small-admin text-muted">{t.label}</span>
        <TelegramCard key={data.telegram.kind} state={data.telegram} canEdit={data.canEdit} dict={t} />
        <span className="text-small-admin text-pretty text-muted">{t.only}</span>
      </div>
    </PaneGrid>
  )
}
