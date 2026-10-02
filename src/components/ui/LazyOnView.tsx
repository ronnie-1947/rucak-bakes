"use client"

import { type ReactNode, useEffect, useRef, useState } from "react"

type LazyOnViewProps = {
  children: ReactNode
  /** Deep-link anchor. Lives here so the scroll target exists before the inner mounts. */
  id?: string
  /** How early to mount, as a root margin. Default fires roughly one screen ahead. */
  rootMargin?: string
  /** Reserves height before mount so the page doesn't jump. */
  className?: string
  /** Rendered until the gate opens — a skeleton, or nothing. */
  fallback?: ReactNode
}

export function LazyOnView({ children, id, rootMargin = "600px", className, fallback = null }: LazyOnViewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (shown) return
    const node = ref.current
    if (!node) return

    // Every browser Next 16 supports (Safari 16.4+, Chromium/Firefox 111+) ships IntersectionObserver.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [shown, rootMargin])

  return (
    <div ref={ref} id={id} className={className}>
      {shown ? children : fallback}
    </div>
  )
}
