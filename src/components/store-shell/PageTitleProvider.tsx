"use client"

import { type ReactNode, useMemo, useState } from "react"
import { type PageTitle, PageTitleContext } from "@/hooks/usePageTitle"

type PageTitleProviderProps = {
  children: ReactNode
}

/** Holds the sub-page header's title, which the page below it sets (hooks/usePageTitle). Wraps the header and the page alike. */
export function PageTitleProvider({ children }: PageTitleProviderProps) {
  const [title, setTitle] = useState<PageTitle | null>(null)
  const api = useMemo(() => ({ title, setTitle }), [title])
  return <PageTitleContext value={api}>{children}</PageTitleContext>
}
