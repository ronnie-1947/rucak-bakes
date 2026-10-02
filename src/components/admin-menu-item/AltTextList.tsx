"use client"

import { useId, useState } from "react"
import { Icon } from "@/components/ui/icons/Icon"
import { TextInput } from "@/components/ui/TextInput"
import { LIMITS } from "@/lib/menu/form"
import { fill } from "@/lib/template"
import { PhotoImage } from "./PhotoImage"
import type { ItemCopy } from "./types"
import type { ItemForm } from "./useItemForm"

type AltTextListProps = {
  form: ItemForm
  dict: ItemCopy["photos"]
}

/** "Alt text (optional)" — collapsed by default; one short description per photo, for screen readers and search. */
export function AltTextList({ form, dict }: AltTextListProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 items-center gap-2 self-start font-semibold text-o700 focus-visible:outline-2 focus-visible:outline-o700"
      >
        <span>{dict.altToggle}</span>
        <Icon name="chevronDown" className={`size-4 transition-transform duration-150 ease-out ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div id={panelId} className="flex flex-col gap-2">
          <span className="text-small-admin text-pretty text-muted">{dict.altHint}</span>
          {form.photos.map((photo, index) => (
            <div key={photo.key} className="flex items-center gap-2">
              <span className="relative size-11 shrink-0 overflow-hidden rounded-chip border border-border bg-sunken">
                <PhotoImage photo={{ ...photo, alt: "" }} width={88} ratio="1:1" />
              </span>
              <TextInput
                value={photo.alt}
                maxLength={LIMITS.alt}
                aria-label={fill(dict.altLabel, { n: index + 1 })}
                placeholder={index === 0 ? dict.altCoverPlaceholder : fill(dict.altPlaceholder, { n: index + 1 })}
                onChange={(event) => form.setAlt(photo.key, event.target.value)}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
