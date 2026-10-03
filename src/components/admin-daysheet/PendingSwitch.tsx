"use client"

import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/Switch"

type PendingSwitchProps = {
  on: boolean
  /** The same sheet with the switch the other way — `?pending=1` comes and goes. */
  href: string
  /** "Include 2 pending orders" */
  label: string
}

/** Off by default. On, pending quantities appear beside the bake totals — never added into them. */
export function PendingSwitch({ on, href, label }: PendingSwitchProps) {
  const router = useRouter()
  return <Switch checked={on} onChange={() => router.replace(href, { scroll: false })} stateLabel={label} label={label} />
}
