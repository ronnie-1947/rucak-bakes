"use client"

import { useEffect, useState } from "react"

/**
 * True once the window has scrolled past `enter` px, false again only back above `leave` px. False on the server
 * and before hydration.
 *
 * The gap is the point. A condensing header changes its own height (the store header shrinks by up to ~42px), and
 * scroll anchoring moves scrollY by that much the moment it does — with a single threshold the state flips back,
 * the height comes back, scrollY jumps again, and React loops ("Maximum update depth exceeded"). Keep
 * `enter − leave` larger than the height change. Updates are batched to one per frame.
 */
export function useScrolled(enter = 64, leave = 8): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setScrolled((was) => (was ? window.scrollY > leave : window.scrollY > enter))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    // A reload can restore a scrolled position before any scroll event.
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [enter, leave])

  return scrolled
}
