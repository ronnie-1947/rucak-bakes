"use client"

import { type ReactNode, useMemo, useState } from "react"
import { type PageTitle, PageTitleContext } from "@/hooks/usePageTitle"

type PageTitleProviderProps = {
  children: ReactNode
}

/** Holds the sub-page header's title and the page's own Back, which the page below it sets (hooks/usePageTitle). Wraps the header and the page alike. */
export function PageTitleProvider({ children }: PageTitleProviderProps) {
  const [title, setTitle] = useState<PageTitle | null>(null)
  const [back, setBack] = useState<(() => void) | null>(null)
  const api = useMemo(() => ({ title, setTitle, back, setBack }), [title, back])
  return <PageTitleContext value={api}>{children}</PageTitleContext>
}
