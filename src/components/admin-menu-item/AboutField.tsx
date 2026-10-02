"use client"

import { useId, useRef } from "react"
import { Icon } from "@/components/ui/icons/Icon"
import { LIMITS } from "@/lib/menu/form"
import { fill } from "@/lib/template"
import type { ItemCopy } from "./types"

type AboutFieldProps = {
  value: string
  onChange: (value: string) => void
  dict: ItemCopy
}

type Format = "bold" | "italic" | "bullet"

const tool = "grid size-11 place-items-center rounded-chip text-foreground hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"

/**
 * The item page's longer text. A small toolbar wraps the selection in **bold** or _italic_, or starts
 * the line with "• " — plain-text marks the item page renders, so nothing here stores HTML.
 */
export function AboutField({ value, onChange, dict }: AboutFieldProps) {
  const id = useId()
  const area = useRef<HTMLTextAreaElement>(null)
  const d = dict.details

  const apply = (format: Format) => {
    const textarea = area.current
    if (!textarea) return
    const { selectionStart: start, selectionEnd: end } = textarea
    let next: string
    let caret: [number, number]
    if (format === "bullet") {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1
      next = `${value.slice(0, lineStart)}• ${value.slice(lineStart)}`
      caret = [start + 2, end + 2]
    } else {
      const mark = format === "bold" ? "**" : "_"
      next = `${value.slice(0, start)}${mark}${value.slice(start, end)}${mark}${value.slice(end)}`
      caret = [start + mark.length, end + mark.length]
    }
    if (next.length > LIMITS.about) return
    onChange(next)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(...caret)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small-admin text-muted">
        {d.about}
      </label>
      <div className="rounded-field border border-border focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-o700">
        <div role="toolbar" aria-controls={id} className="flex gap-1 border-b border-border px-1">
          <button type="button" aria-label={d.bold} onClick={() => apply("bold")} className={`${tool} font-semibold`}>
            B
          </button>
          <button type="button" aria-label={d.italic} onClick={() => apply("italic")} className={`${tool} font-display italic`}>
            I
          </button>
          <button type="button" aria-label={d.bullet} onClick={() => apply("bullet")} className={tool}>
            <Icon name="list" className="size-4.5" />
          </button>
        </div>
        <textarea
          id={id}
          ref={area}
          value={value}
          rows={6}
          maxLength={LIMITS.about}
          onChange={(event) => onChange(event.target.value)}
          className="block min-h-24 w-full resize-y rounded-b-field bg-transparent p-3 text-body text-foreground outline-none md:text-body-admin"
        />
      </div>
      <span className="self-end text-small-admin text-muted tabular-nums">{fill(dict.basics.count, { count: value.length, max: LIMITS.about })}</span>
    </div>
  )
}
