"use client"

import { useState, useTransition } from "react"
import { type ConnectResult, connectTelegram, disconnectTelegram, sendTelegramTest } from "@/app/actions/settings"
import { Button } from "@/components/ui/Button"
import type { TelegramState } from "@/lib/settings/telegram"
import { fill } from "@/lib/template"
import { ConnectSteps } from "./ConnectSteps"
import { DisconnectDialog } from "./DisconnectDialog"
import type { SettingsCopy } from "./types"

type TelegramCardProps = {
  state: TelegramState
  canEdit: boolean
  dict: SettingsCopy["telegram"]
}

type Kind = TelegramState["kind"]
type Busy = "connect" | "test" | "disconnect" | null
type ConnectProblem = Exclude<ConnectResult, { ok: true }>["reason"]
type TestNote = { ok: true; at: string } | { ok: false } | null

const frames: Record<Kind, string> = {
  unavailable: "border-border bg-sunken",
  off: "border-border bg-background",
  on: "border-green-soft bg-green-soft",
  failed: "border-red bg-red-soft",
}

const dots: Record<Kind, string> = {
  unavailable: "bg-border-strong",
  off: "bg-border-strong",
  on: "bg-green",
  failed: "bg-red",
}

const titles: Record<Kind, string> = {
  unavailable: "text-foreground",
  off: "text-foreground",
  on: "text-green",
  failed: "text-red",
}

/**
 * Order alerts on Telegram — connected (green, with when the last message landed), not connected (the four
 * steps and today's code), failing (red, saying why and what to do meanwhile), or not set up at all. Test,
 * Disconnect (after a confirm) and Reconnect run here; the screen refreshes with the result.
 */
export function TelegramCard({ state, canEdit, dict }: TelegramCardProps) {
  const [busy, setBusy] = useState<Busy>(null)
  const [, startTransition] = useTransition()
  const [connectProblem, setConnectProblem] = useState<ConnectProblem | null>(null)
  const [testNote, setTestNote] = useState<TestNote>(null)
  const [reconnecting, setReconnecting] = useState(false)
  const [confirmOff, setConfirmOff] = useState(false)

  const run = (kind: Exclude<Busy, null>, action: () => Promise<void>) => {
    setBusy(kind)
    startTransition(async () => {
      try {
        await action()
      } finally {
        setBusy(null)
      }
    })
  }

  const connect = () =>
    run("connect", async () => {
      setConnectProblem(null)
      const result = await connectTelegram().catch(() => ({ ok: false, reason: "UNREACHABLE" }) as const)
      if (!result.ok) setConnectProblem(result.reason)
    })

  const test = () =>
    run("test", async () => {
      setTestNote(null)
      const result = await sendTelegramTest().catch(() => ({ ok: false }) as const)
      setTestNote(result.ok ? { ok: true, at: result.at } : { ok: false })
    })

  const disconnect = () =>
    run("disconnect", async () => {
      await disconnectTelegram().catch(() => undefined)
      setConfirmOff(false)
    })

  const steps = state.kind === "off" || state.kind === "failed" ? state.steps : null
  const showSteps = canEdit && (state.kind === "off" || reconnecting)
  const body: Record<Kind, string> = {
    unavailable: dict.unavailableBody,
    off: dict.offBody,
    on:
      state.kind === "on"
        ? `${fill(dict.onBody, { when: state.connectedLabel })} ${state.lastSentLabel ? fill(dict.lastSent, { when: state.lastSentLabel }) : dict.nothingSent}`
        : "",
    failed: state.kind === "failed" ? fill(dict.failedBody, { when: state.failedLabel, why: dict.failures[state.failure] }) : "",
  }
  const title: Record<Kind, string> = { unavailable: dict.unavailableTitle, off: dict.offTitle, on: dict.onTitle, failed: dict.failedTitle }
  const connectProblems: Record<ConnectProblem, string> = {
    NOT_FOUND: dict.notFound,
    UNREACHABLE: dict.unreachable,
    NOT_SET_UP: dict.unavailableBody,
    INVALID: dict.unreachable,
    FORBIDDEN: dict.unreachable,
  }

  return (
    <div className={`flex flex-col gap-3 rounded-panel border p-3 ${frames[state.kind]}`}>
      <span className="flex items-center gap-2">
        <span aria-hidden className={`size-2 shrink-0 rounded-pill ${dots[state.kind]}`} />
        <span className={`font-semibold ${titles[state.kind]}`}>{title[state.kind]}</span>
      </span>
      <p className="text-small-admin text-pretty tabular-nums">{body[state.kind]}</p>

      {showSteps && steps ? <ConnectSteps steps={steps} dict={dict} /> : null}

      {canEdit && state.kind !== "unavailable" ? (
        <div className="flex flex-wrap items-center gap-2">
          {showSteps ? (
            <Button variant="primary" disabled={busy !== null} onClick={connect}>
              {busy === "connect" ? dict.connecting : dict.connect}
            </Button>
          ) : null}
          {state.kind === "failed" && !reconnecting ? (
            <Button variant="primary" onClick={() => setReconnecting(true)}>
              {dict.reconnect}
            </Button>
          ) : null}
          {state.kind === "on" || state.kind === "failed" ? (
            <Button variant="outline" disabled={busy !== null} onClick={test}>
              {busy === "test" ? dict.testing : dict.test}
            </Button>
          ) : null}
          {state.kind === "on" ? (
            <Button variant="ghost" className="text-muted" disabled={busy !== null} onClick={() => setConfirmOff(true)}>
              {dict.disconnect}
            </Button>
          ) : null}
          {testNote ? (
            <span role="status" className={`text-small-admin font-semibold tabular-nums ${testNote.ok ? "text-green" : "text-red"}`}>
              {testNote.ok ? fill(dict.testSent, { time: testNote.at }) : dict.testFailed}
            </span>
          ) : null}
        </div>
      ) : null}

      {connectProblem ? (
        <p role="alert" className="text-small-admin text-pretty text-red">
          {connectProblems[connectProblem]}
        </p>
      ) : null}

      {confirmOff ? (
        <DisconnectDialog pending={busy === "disconnect"} dict={dict} onClose={() => setConfirmOff(false)} onConfirm={disconnect} />
      ) : null}
    </div>
  )
}
