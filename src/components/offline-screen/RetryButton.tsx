"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/Button"

type RetryButtonProps = {
  label: string
}

function reload() {
  window.location.reload()
}

/** Reloads the page the visitor asked for — on a tap, or by itself the moment the browser is back online. */
export function RetryButton({ label }: RetryButtonProps) {
  useEffect(() => {
    window.addEventListener("online", reload)
    return () => window.removeEventListener("online", reload)
  }, [])

  return (
    <Button size="lg" onClick={reload} className="w-full font-semibold">
      {label}
    </Button>
  )
}
