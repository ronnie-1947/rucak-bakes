import type { SettingsPageData } from "@/lib/settings/queries"
import { AppearanceSection } from "./AppearanceSection"
import { BakerySection } from "./BakerySection"
import { NotificationsSection } from "./NotificationsSection"
import { OrderingSection } from "./OrderingSection"
import { StaffSection } from "./StaffSection"
import type { SettingsCopy } from "./types"

type SettingsPaneProps = {
  data: SettingsPageData
  dict: SettingsCopy
}

/** The open section's body. */
export function SettingsPane({ data, dict }: SettingsPaneProps) {
  switch (data.active) {
    case "bakery":
      return <BakerySection data={data} dict={dict} />
    case "ordering":
      return <OrderingSection data={data} dict={dict} />
    case "notifications":
      return <NotificationsSection data={data} dict={dict} />
    case "staff":
      return <StaffSection data={data} dict={dict} />
    case "appearance":
      return <AppearanceSection data={data} dict={dict} />
  }
}
