"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { checkDaySheet } from "@/app/actions/daysheet"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { Spinner } from "@/components/ui/Spinner"

type PrintButtonProps = {
  date: string
  /** The orders the sheet was rendered with — `SheetVersion.orders`. */
  orders: string[]
  label: string
  updatingLabel: string
}

const sameOrders = (a: string[], b: string[]) => a.length === b.length && a.every((key, index) => key === b[index])

/**
 * Opens the browser's print dialog — the page carries its own A4 layout (PrintSheet), so what prints is not the screen.
 * The printout is what gets baked, and SheetWatcher only catches up every 15 seconds — and only offers a refresh for new
 * and newly verified orders — so it asks for the day's orders first: when one has arrived, been verified, cancelled or
 * marked no-show since, it refreshes and prints once the fresh sheet has rendered. If the check fails it prints what it has.
 */
export function PrintButton({ date, orders, label, updatingLabel }: PrintButtonProps) {
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [refreshing, startTransition] = useTransition()
  const queued = useRef(false)

  useEffect(() => {
    if (refreshing || !queued.current) return
    queued.current = false
    window.print()
  }, [refreshing])

  async function print() {
    setChecking(true)
    const latest = await checkDaySheet(date).catch(() => null)
    setChecking(false)
    if (!latest || sameOrders(latest.orders, orders)) {
      window.print()
      return
    }
    queued.current = true
    startTransition(() => router.refresh())
  }

  const busy = checking || refreshing
  return (
    <Button onClick={print} disabled={busy} className="shrink-0">
      {busy ? <Spinner tone="inverse" /> : <Icon name="print" className="size-4.5" />}
      <span>{busy ? updatingLabel : label}</span>
    </Button>
  )
}
