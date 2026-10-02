"use client"

import { type RefObject, useEffect } from "react"

/**
 * Closes a popover while it's open: a press anywhere outside `root`, or Escape. Every ⋯ menu and
 * dropdown uses this rather than its own document listeners.
 */
export function useDismiss(root: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return
    const onEvent = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) close()
    }
    document.addEventListener("pointerdown", onEvent)
    document.addEventListener("keydown", onEvent)
    return () => {
      document.removeEventListener("pointerdown", onEvent)
      document.removeEventListener("keydown", onEvent)
    }
  }, [root, open, close])
}
