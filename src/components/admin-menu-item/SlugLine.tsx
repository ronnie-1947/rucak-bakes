"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Notice } from "@/components/ui/Notice"
import { inputShellClasses } from "@/components/ui/TextInput"
import { fill } from "@/lib/template"
import type { ItemCopy } from "./types"

type SlugLineProps = {
  slug: string
  /** The address the saved item lives at — changing it breaks old links. Null when creating. */
  savedSlug: string | null
  onChange: (slug: string) => void
  error?: string
  dict: ItemCopy["basics"]
}

/** "/menu/cardamom-bun · Edit" under the name; Edit opens a prefixed input. Warns when a saved address changes. */
export function SlugLine({ slug, savedSlug, onChange, error, dict }: SlugLineProps) {
  const [editing, setEditing] = useState(false)
  const id = useId()
  const open = editing || Boolean(error)

  return (
    <div className="flex flex-col gap-2">
      {open ? (
        <div className="flex gap-2">
          <label htmlFor={id} className="sr-only">
            {dict.slugLabel}
          </label>
          <div
            className={inputShellClasses(error ? "invalid" : "valid")}
          >
            <span className="flex shrink-0 items-center border-r border-border bg-sunken px-2 font-mono text-small-admin text-muted">
              {dict.slugPrefix}
            </span>
            <input
              id={id}
              value={slug}
              onChange={(event) =>
                onChange(
                  event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-")
                    .slice(0, 80),
                )
              }
              aria-invalid={Boolean(error) || undefined}
              autoCapitalize="none"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent px-2 font-mono outline-none"
            />
          </div>
          <Button variant="outline" onClick={() => setEditing(false)}>
            {dict.slugDone}
          </Button>
        </div>
      ) : (
        <span className="flex flex-wrap items-center gap-x-2 text-small-admin text-muted">
          <span className="font-mono break-all">
            {dict.slugPrefix}
            {slug}
          </span>
          <Button variant="link" size="inline" className="px-1" onClick={() => setEditing(true)}>
            {dict.slugEdit}
          </Button>
        </span>
      )}
      {error ? <span className="text-small-admin text-red">{error}</span> : null}
      {savedSlug && slug !== savedSlug ? (
        <Notice tone="warm" className="tabular-nums">
          {fill(dict.slugWarn, { slug: savedSlug })}
        </Notice>
      ) : null}
    </div>
  )
}
