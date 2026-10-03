"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CloseIcon } from "@/components/ui/icons/CloseIcon"
import { Icon } from "@/components/ui/icons/Icon"

type SearchBoxProps = {
  /** The current search, from the URL. */
  value: string
  /** The screen's URL with every other filter and no `q` — the box adds `q` to it. Built on the server. */
  baseHref: string
  label: string
  placeholder: string
  /** When given, a × inside the field clears the search. */
  clearLabel?: string
  /** A muted line under the field — "Paste or type any part of a number". */
  hint?: string
}

/** With our own ×, the browser's search-cancel glyph would be a second one. */
const paddings: Record<"clear" | "plain", string> = {
  clear: "pr-11 [&::-webkit-search-cancel-button]:appearance-none",
  plain: "pr-3",
}

function withQuery(baseHref: string, q: string): string {
  if (!q) return baseHref
  return `${baseHref}${baseHref.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}`
}

/** A full-width search field whose text lives in the URL's `?q=`. Updates the URL 300ms after typing stops. */
export function SearchBox({ value: q, baseHref, label, placeholder, clearLabel, hint }: SearchBoxProps) {
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

  const clearable = Boolean(clearLabel) && value !== ""
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <label className="block">
          <span className="sr-only">{label}</span>
          <Icon name="search" className="pointer-events-none absolute top-3 left-3 size-5 text-muted" />
          <input
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            enterKeyHint="search"
            className={`h-11 w-full rounded-field border border-border bg-background pl-10 text-body text-foreground tabular-nums placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 md:text-body-admin ${paddings[clearable ? "clear" : "plain"]}`}
          />
        </label>
        {clearable ? (
          <button
            type="button"
            onClick={() => setValue("")}
            aria-label={clearLabel}
            className="absolute top-0 right-0 grid size-11 place-items-center rounded-field text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-o700"
          >
            <CloseIcon className="size-4" />
          </button>
        ) : null}
      </div>
      {hint && !value ? <span className="text-small-admin text-muted">{hint}</span> : null}
    </div>
  )
}
