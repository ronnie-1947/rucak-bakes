"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Icon } from "@/components/ui/icons/Icon"

type SearchBoxProps = {
  /** The current search, from the URL. */
  value: string
  /** The screen's URL with every other filter and no `q` — the box adds `q` to it. Built on the server. */
  baseHref: string
  label: string
  placeholder: string
}

function withQuery(baseHref: string, q: string): string {
  if (!q) return baseHref
  return `${baseHref}${baseHref.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}`
}

/** A full-width search field whose text lives in the URL's `?q=`. Updates the URL 300ms after typing stops. */
export function SearchBox({ value: q, baseHref, label, placeholder }: SearchBoxProps) {
  const router = useRouter()
  const [value, setValue] = useState(q)
  const [seenQ, setSeenQ] = useState(q)

  // "Clear filters" empties q in the URL — empty the box too. (Adjusting state on a prop change, not in an effect.)
  if (q !== seenQ) {
    setSeenQ(q)
    if (q === "") setValue("")
  }

  useEffect(() => {
    if (value.trim() === q) return
    const timer = setTimeout(() => router.replace(withQuery(baseHref, value.trim()), { scroll: false }), 300)
    return () => clearTimeout(timer)
  }, [value, q, baseHref, router])

  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Icon name="search" className="pointer-events-none absolute top-3 left-3 size-5 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        enterKeyHint="search"
        className="h-11 w-full rounded-field border border-border bg-background pr-3 pl-10 text-body text-foreground placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 md:text-body-admin"
      />
    </label>
  )
}
