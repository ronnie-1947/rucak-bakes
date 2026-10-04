"use client"

import { createContext, useContext, useEffect } from "react"

/** The sub-page header's middle: the page's name, shown once the page's own heading has scrolled up under the header. */
export type PageTitle = { text: string; shown: boolean }

export type PageTitleApi = {
  title: PageTitle | null
  setTitle: (title: PageTitle | null) => void
}

export const PageTitleContext = createContext<PageTitleApi | null>(null)

/** How far down the sticky sub-page header reaches — 8px padding, a 44px button, 8px padding and its 1px border. */
const HEADER_PX = 61

/** For the header (store-shell's PageBar): the current title, or null when the page hasn't set one. */
export function usePageTitleState(): PageTitle | null {
  const api = useContext(PageTitleContext)
  if (!api) throw new Error("usePageTitleState must be used inside <PageTitleProvider>")
  return api.title
}

/**
 * Put `text` in the store header while this page is open, faded in once the element with `id` — the page's
 * own heading, rendered on the server — has gone up under the header, and out again when it comes back.
 * Inside a PageTitleProvider (src/components/store-shell/).
 */
export function usePageTitle(text: string, id: string) {
  const api = useContext(PageTitleContext)
  if (!api) throw new Error("usePageTitle must be used inside <PageTitleProvider>")
  const { setTitle } = api

  useEffect(() => {
    setTitle({ text, shown: false })
    const heading = document.getElementById(id)
    if (!heading) return () => setTitle(null)
    const observer = new IntersectionObserver(
      ([entry]) => setTitle({ text, shown: !entry.isIntersecting && entry.boundingClientRect.top < HEADER_PX }),
      { rootMargin: `-${HEADER_PX}px 0px 0px 0px` },
    )
    observer.observe(heading)
    return () => {
      observer.disconnect()
      setTitle(null)
    }
  }, [text, id, setTitle])
}
