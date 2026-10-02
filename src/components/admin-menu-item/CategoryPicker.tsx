"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Chip } from "@/components/ui/Chip"
import { TextInput } from "@/components/ui/TextInput"
import type { CategoryChoice } from "@/lib/menu/form"
import type { ItemCopy } from "./types"

type CategoryPickerProps = {
  value: CategoryChoice
  categories: { slug: string; name: string }[]
  onChange: (value: CategoryChoice) => void
  error?: string
  required: string
  dict: ItemCopy["basics"]
}

/**
 * One chip per category, plus "+ Add category" for a new one. A typed category is only created when the
 * item saves — abandoning the form leaves no stray category behind.
 */
export function CategoryPicker({ value, categories, onChange, error, required, dict }: CategoryPickerProps) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState("")
  const inputId = useId()
  const labelId = useId()
  const typed = value && "newName" in value ? value.newName : null

  const add = () => {
    const name = draft.trim()
    setAdding(false)
    setDraft("")
    if (!name) return
    const existing = categories.find((category) => category.name.toLowerCase() === name.toLowerCase())
    onChange(existing ? { slug: existing.slug } : { newName: name })
  }

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span id={labelId} className="text-small-admin text-muted">
          {dict.category}
        </span>
        <span className="text-micro font-semibold text-muted uppercase">{required}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Chip
            key={category.slug}
            selected={Boolean(value && "slug" in value && value.slug === category.slug)}
            onClick={() => onChange({ slug: category.slug })}
          >
            {category.name}
          </Chip>
        ))}
        {typed ? (
          <Chip selected onClick={() => undefined}>
            {typed}
          </Chip>
        ) : null}
        {adding ? (
          <div className="flex gap-2">
            <label htmlFor={inputId} className="sr-only">
              {dict.newCategory}
            </label>
            <TextInput
              id={inputId}
              autoFocus
              value={draft}
              maxLength={40}
              placeholder={dict.newCategoryPlaceholder}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  add()
                } else if (event.key === "Escape") setAdding(false)
              }}
              className="w-40"
            />
            <Button variant="outline" onClick={add}>
              {dict.addCategoryOk}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="min-h-11 rounded-chip border border-dashed border-border-strong bg-background px-3 text-small-admin font-semibold text-o700 hover:bg-o50 focus-visible:outline-2 focus-visible:outline-o700"
          >
            {dict.addCategory}
          </button>
        )}
      </div>
      {error ? <span className="text-small-admin text-red">{error}</span> : null}
    </div>
  )
}
