"use client"

import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"

type PrintButtonProps = {
  label: string
}

/** Opens the browser's print dialog — the page carries its own A4 layout (PrintSheet), so what prints is not the screen. */
export function PrintButton({ label }: PrintButtonProps) {
  return (
    <Button onClick={() => window.print()} className="shrink-0">
      <Icon name="print" className="size-4.5" />
      <span>{label}</span>
    </Button>
  )
}
