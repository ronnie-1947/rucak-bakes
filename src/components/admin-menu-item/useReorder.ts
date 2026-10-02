"use client"

import { type KeyboardEvent, type PointerEvent, useState } from "react"

/**
 * Reorder by a drag handle — pointer events, so it works the same with a mouse, a pen and a finger, and
 * the handle's `touch-none` keeps the page from scrolling under the drag (never long-press: it fights
 * scroll on touch). Arrow keys on the focused handle move one place. Each item carries
 * `data-reorder={group}` and `data-reorder-index`; the handle gets `handleProps(key, index)`.
 */
export function useReorder(group: string, onMove: (key: string, to: number) => void) {
  const [dragging, setDragging] = useState<string | null>(null)

  const handleProps = (key: string, index: number) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(key)
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (dragging !== key) return
      const over = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>(`[data-reorder="${group}"]`)
      const to = over ? Number(over.dataset.reorderIndex) : NaN
      if (Number.isInteger(to) && to !== index) onMove(key, to)
    },
    onPointerUp: () => setDragging(null),
    onPointerCancel: () => setDragging(null),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      const step = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : 0
      if (step === 0) return
      event.preventDefault()
      onMove(key, index + step)
    },
  })

  return { dragging, handleProps }
}
