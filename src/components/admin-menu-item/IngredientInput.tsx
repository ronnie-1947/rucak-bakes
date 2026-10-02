"use client"

import { useId, useState } from "react"
import { CloseIcon } from "@/components/ui/icons/CloseIcon"
import { LIMITS } from "@/lib/menu/form"
import { fill } from "@/lib/template"
import type { ItemCopy } from "./types"
import { useReorder } from "./useReorder"

type IngredientInputProps = {
  value: string[]
  onChange: (value: string[]) => void
  /** Ingredients other items use, most used first. */
  suggestions: string[]
  dict: ItemCopy["details"]
}

const chips: Record<"dragging" | "idle", string> = {
  dragging: "border-o500",
  idle: "border-border",
}

/**
 * Ingredients as chips: Enter (or a comma) adds, Backspace on an empty field takes the last one off,
 * each chip drags to a new place. "Used before:" offers what other items list, filtered as you type.
 */
export function IngredientInput({ value, onChange, suggestions, dict }: IngredientInputProps) {
  const [query, setQuery] = useState("")
  const inputId = useId()
  const hintId = useId()
  const { dragging, handleProps } = useReorder("ingredients", (key, to) => {
    const from = value.indexOf(key)
    const target = Math.min(Math.max(0, to), value.length - 1)
    if (from < 0 || from === target) return
    const next = [...value]
    next.splice(target, 0, ...next.splice(from, 1))
    onChange(next)
  })

  const has = (name: string) => value.some((existing) => existing.toLowerCase() === name.toLowerCase())
  const add = (raw: string) => {
    const name = raw.trim().slice(0, LIMITS.ingredient)
    setQuery("")
    if (!name || has(name) || value.length >= LIMITS.ingredients) return
    onChange([...value, name])
  }

  const q = query.trim().toLowerCase()
  const offered = suggestions.filter((name) => !has(name) && (!q || name.toLowerCase().includes(q))).slice(0, q ? 5 : 3)

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-small-admin text-muted">
        {dict.ingredients}
      </label>
      <div className="flex min-h-11 flex-wrap items-center gap-1 rounded-field border border-border p-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-o700">
        {value.map((name, index) => (
          <span
            key={name}
            data-reorder="ingredients"
            data-reorder-index={index}
            className={`inline-flex h-8 items-center rounded-chip border bg-sunken text-small-admin ${chips[dragging === name ? "dragging" : "idle"]}`}
          >
            <button
              type="button"
              aria-label={fill(dict.moveIngredient, { name })}
              {...handleProps(name, index)}
              className="h-full cursor-grab touch-none rounded-l-chip pr-1 pl-3 focus-visible:outline-2 focus-visible:outline-o700 active:cursor-grabbing"
            >
              <span aria-hidden>{name}</span>
            </button>
            <button
              type="button"
              aria-label={fill(dict.removeIngredient, { name })}
              onClick={() => onChange(value.filter((existing) => existing !== name))}
              className="grid size-8 place-items-center rounded-r-chip text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-o700"
            >
              <CloseIcon className="size-4" />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={query}
          placeholder={value.length > 0 ? dict.ingredientNext : dict.ingredientFirst}
          aria-describedby={hintId}
          onChange={(event) => {
            const typed = event.target.value
            if (typed.includes(",")) typed.split(",").slice(0, -1).forEach(add)
            setQuery(typed.includes(",") ? (typed.split(",").pop() ?? "") : typed)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              add(query)
            } else if (event.key === "Backspace" && !query && value.length > 0) {
              onChange(value.slice(0, -1))
            }
          }}
          className="h-8 min-w-30 flex-1 bg-transparent px-2 text-body text-foreground outline-none placeholder:text-subtle md:text-body-admin"
        />
      </div>
      {offered.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-small-admin text-muted">{dict.usedBefore}</span>
          {offered.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => add(name)}
              className="min-h-11 rounded-chip border border-dashed border-border-strong bg-background px-3 text-small-admin hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
            >
              {fill(dict.addSuggestion, { name })}
            </button>
          ))}
        </div>
      ) : null}
      <span id={hintId} className="text-small-admin text-muted">
        {dict.ingredientsHint}
      </span>
    </div>
  )
}
