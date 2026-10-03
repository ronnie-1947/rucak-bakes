import { Icon } from "@/components/ui/icons/Icon"
import type { ConnectSteps as Steps } from "@/lib/settings/telegram"
import { fill } from "@/lib/template"
import type { SettingsCopy } from "./types"

type ConnectStepsProps = {
  steps: Steps
  dict: SettingsCopy["telegram"]
}

/**
 * How to connect, in four steps — never a chat-id field. The code is today's (it changes daily); the link
 * opens the bot with the code already filled in, for when Telegram is on this device.
 */
export function ConnectSteps({ steps, dict }: ConnectStepsProps) {
  const lines = [
    dict.stepOpen,
    steps.bot ? fill(dict.stepSearch, { bot: steps.bot }) : dict.stepSearchUnknown,
    dict.stepCode,
    dict.stepBack,
  ]
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">
        {lines.map((line, index) => (
          <li key={line} className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-2">
            <span
              aria-hidden
              className="grid size-6 place-items-center rounded-pill border border-o200 bg-o50 text-micro font-semibold text-o700 tabular-nums"
            >
              {index + 1}
            </span>
            <span className="flex flex-col items-start gap-2 text-pretty">
              {line}
              {index === 2 ? (
                <span className="rounded-field border border-border-strong bg-background px-4 py-2 font-display text-h1 font-semibold tracking-widest tabular-nums select-all">
                  {steps.code}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
      {steps.link && steps.bot ? (
        <a
          href={steps.link}
          target="_blank"
          rel="noopener"
          className="flex min-h-11 items-center gap-2 self-start text-small-admin font-semibold text-o700 hover:underline"
        >
          <Icon name="external" className="size-4" />
          {fill(dict.openBot, { bot: steps.bot })}
        </a>
      ) : null}
    </div>
  )
}
