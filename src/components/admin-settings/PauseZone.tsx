"use client"

import { useOptimistic, useState } from "react"
import { setOrderingPaused } from "@/app/actions/settings"
import { Field } from "@/components/ui/Field"
import { Switch } from "@/components/ui/Switch"
import { TextInput } from "@/components/ui/TextInput"
import { SETTINGS_LIMITS } from "@/lib/settings/form"
import { fill } from "@/lib/template"
import { fullRow } from "./layout"
import { LiveMark } from "./LiveMark"
import { PauseDialog } from "./PauseDialog"
import type { SettingsCopy } from "./types"
import { useLiveSave } from "./useLiveSave"

type PauseZoneProps = {
  pause: { paused: boolean; reason: string }
  dict: SettingsCopy
}

type Look = "paused" | "open"

const previews: Record<Look, string> = {
  paused: "border-red bg-red-soft text-red",
  open: "border-border bg-background text-muted",
}

/**
 * The danger zone, detached at the foot of Ordering rules: pause every new order, with the reason customers
 * will see — required, previewed, and confirmed before it takes effect. It saves instantly; resuming is one
 * tap. While paused the reason is locked, so what customers read always matches what's shown here.
 */
export function PauseZone({ pause, dict }: PauseZoneProps) {
  const d = dict.pause
  const [paused, setPaused] = useOptimistic(pause.paused)
  const [reason, setReason] = useState(pause.reason)
  const [missing, setMissing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const live = useLiveSave()
  const look: Look = paused ? "paused" : "open"

  const flip = () => {
    if (live.pending) return
    if (paused) {
      live.run(
        () => setOrderingPaused({ paused: false }),
        () => setPaused(false),
      )
    } else if (!reason.trim()) setMissing(true)
    else setConfirming(true)
  }

  const confirm = () => {
    setConfirming(false)
    live.run(
      () => setOrderingPaused({ paused: true, reason: reason.trim() }),
      () => setPaused(true),
    )
  }

  return (
    <section aria-labelledby="pause-title" className={`mt-6 flex min-w-0 flex-col gap-4 rounded-panel border border-red p-3 ${fullRow}`}>
      <h3 id="pause-title" className="text-h2 text-red">
        {d.zone}
      </h3>
      <Field id="pause-reason" label={d.reason} error={missing ? d.reasonRequired : undefined} hint={paused ? d.reasonLocked : undefined}>
        <TextInput
          id="pause-reason"
          value={reason}
          maxLength={SETTINGS_LIMITS.pauseReason}
          placeholder={d.reasonPlaceholder}
          disabled={paused}
          invalid={missing}
          aria-describedby="pause-reason-message"
          onChange={(event) => {
            setReason(event.target.value)
            setMissing(false)
          }}
        />
      </Field>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Switch checked={paused} onChange={flip} stateLabel={paused ? d.on : d.off} label={d.switchLabel} tone="danger" />
          <LiveMark mark={live.mark} dict={dict.live} />
        </div>
        <span className="text-small-admin text-pretty text-muted">{d.hint}</span>
      </div>
      <div className="flex flex-col gap-2 rounded-panel border border-border bg-sunken p-3">
        <span className="text-micro font-semibold text-muted uppercase">{d.preview}</span>
        <span className={`rounded-chip border px-3 py-2 text-small-admin font-semibold text-pretty ${previews[look]}`}>
          {paused ? fill(d.previewPaused, { reason: reason.trim() }) : d.previewOpen}
        </span>
      </div>
      {confirming ? <PauseDialog reason={reason.trim()} dict={d} onClose={() => setConfirming(false)} onConfirm={confirm} /> : null}
    </section>
  )
}
