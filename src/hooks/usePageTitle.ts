"use client"

import { createContext, useContext, useEffect } from "react"

/** The sub-page header's middle: the page's name, shown once the page's own heading has scrolled up under the header. */
export type PageTitle = { text: string; shown: boolean }

export type PageTitleApi = {
  title: PageTitle | null
  setTitle: (title: PageTitle | null) => void
  /** What the header's Back does instead of leaving the page — a step within it (the cart's details → cart). */
  back: (() => void) | null
  setBack: (back: (() => void) | null) => void
}

export const PageTitleContext = createContext<PageTitleApi | null>(null)

/** How far down the sticky sub-page header reaches — 8px padding, a 44px button, 8px padding and its 1px border. */
const HEADER_PX = 61

/** For the header (store-shell's PageBar): the current title, or null when the page hasn't set one, and the page's own Back. */
export function usePageTitleState(): Pick<PageTitleApi, "title" | "back"> {
  const api = useContext(PageTitleContext)
  if (!api) throw new Error("usePageTitleState must be used inside <PageTitleProvider>")
  return { title: api.title, back: api.back }
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

/** While `back` is set, the store header's Back calls it instead of leaving the page. Null hands Back to the header again. */
export function usePageBack(back: (() => void) | null) {
  const api = useContext(PageTitleContext)
  if (!api) throw new Error("usePageBack must be used inside <PageTitleProvider>")
  const { setBack } = api

  useEffect(() => {
    setBack(back ? () => back : null)
    return () => setBack(null)
  }, [back, setBack])
}
