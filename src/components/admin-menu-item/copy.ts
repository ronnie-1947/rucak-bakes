import type { ChangeKey } from "@/lib/menu/form"
import { fill } from "@/lib/template"
import type { ItemCopy } from "./types"
import type { Problem } from "./useItemForm"

type ErrorCode = keyof ItemCopy["errors"]

/** "Basics — enter a name" — the error summary's line. */
export function problemText(problem: Problem, dict: ItemCopy): string {
  return fill(dict.errors[problem.code as ErrorCode] ?? problem.code, problem.values ?? {})
}

/** "Enter a name" — the same message under its field, without the section prefix. */
export function inlineError(code: string | undefined, dict: ItemCopy, values: Record<string, string | number> = {}): string | undefined {
  if (!code) return undefined
  const text = fill(dict.errors[code as ErrorCode] ?? code, values).replace(/^[^—]+— /, "")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "Name, Base price, Photos" */
export function changesText(changes: ChangeKey[], dict: ItemCopy): string {
  return changes.map((key) => dict.fields[key]).join(", ")
}
