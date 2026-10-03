"use client"

import { useOptimistic } from "react"
import { setAutoVerifyTrusted } from "@/app/actions/settings"
import { Switch } from "@/components/ui/Switch"
import { fullRow } from "./layout"
import { LiveMark } from "./LiveMark"
import type { SettingsCopy } from "./types"
import { useLiveSave } from "./useLiveSave"

type AutoVerifySwitchProps = {
  on: boolean
  dict: SettingsCopy
}

/** Auto-verify trusted customers — saved the moment it's flipped, never part of the section's Save. */
export function AutoVerifySwitch({ on: saved, dict }: AutoVerifySwitchProps) {
  const d = dict.ordering
  const [on, setOn] = useOptimistic(saved)
  const live = useLiveSave()
  const flip = () => {
    if (live.pending) return
    live.run(
      () => setAutoVerifyTrusted({ on: !on }),
      () => setOn(!on),
    )
  }

  return (
    <div role="group" aria-labelledby="auto-verify-label" className={`flex min-w-0 flex-col gap-2 ${fullRow}`}>
      <span id="auto-verify-label" className="text-small-admin text-muted">
        {d.autoVerify}
      </span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Switch checked={on} onChange={flip} stateLabel={on ? d.on : d.off} label={d.autoVerifySwitch} />
        <LiveMark mark={live.mark} dict={dict.live} />
      </div>
      <span className="text-small-admin text-pretty text-muted">{on ? d.autoVerifyOn : d.autoVerifyOff}</span>
    </div>
  )
}
