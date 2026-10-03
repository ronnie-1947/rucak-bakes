import { fill } from "@/lib/template"
import type { SettingsCopy } from "./types"

type TelegramPreviewProps = {
  bakeryName: string
  connected: boolean
  dict: SettingsCopy["preview"]
}

type Weight = "strong" | "plain"

const weights: Record<Weight, string> = {
  strong: "font-semibold",
  plain: "",
}

/** What lands on the owner's phone — a sample new-order message, and whether anything is sent at all. */
export function TelegramPreview({ bakeryName, connected, dict }: TelegramPreviewProps) {
  const last = dict.sample.length - 1
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-sunken p-4">
      <span className="text-small-admin font-semibold text-muted">{fill(dict.telegramFrom, { bakery: bakeryName })}</span>
      <div className="flex max-w-80 flex-col rounded-t-card rounded-br-card rounded-bl-chip border border-border bg-background p-3 text-small-admin tabular-nums">
        {dict.sample.map((line, index) => (
          <span key={line} className={weights[index === 0 || index === last ? "strong" : "plain"]}>
            {line}
          </span>
        ))}
      </div>
      <span className="text-small-admin text-pretty text-muted">{connected ? dict.telegramOn : dict.telegramOff}</span>
    </div>
  )
}
