"use client"

import { useDaySheet } from "@/hooks/useDaySheet"

type PrintStaleProps = {
  text: string
}

/**
 * Printed first, under the header, when SheetWatcher has seen the day's orders change since this render — a Ctrl+P or
 * browser-menu print skips PrintButton's refresh, so the paper says it may miss a new or newly verified order.
 */
export function PrintStale({ text }: PrintStaleProps) {
  const { stale } = useDaySheet()
  if (!stale) return null
  return <p className="break-inside-avoid border-2 border-print px-4 py-3 font-semibold">{text}</p>
}
