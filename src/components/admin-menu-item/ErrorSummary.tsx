"use client"

import { fill } from "@/lib/template"
import { problemText } from "./copy"
import type { ItemCopy } from "./types"
import type { Problem } from "./useItemForm"

type ErrorSummaryProps = {
  problems: Problem[]
  dict: ItemCopy
}

/** After a refused save: every problem in one red block, each a link that scrolls to its section. */
export function ErrorSummary({ problems, dict }: ErrorSummaryProps) {
  return (
    <div role="alert" className="flex flex-col gap-1 rounded-panel border border-red bg-red-soft p-3">
      <span className="font-semibold text-red tabular-nums">
        {problems.length === 1 ? dict.errorsTitleOne : fill(dict.errorsTitle, { count: problems.length })}
      </span>
      {problems.map((problem) => (
        <button
          key={`${problem.section}-${problem.code}`}
          type="button"
          onClick={() => document.getElementById(problem.section)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="min-h-11 text-left text-red underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-o700"
        >
          {problemText(problem, dict)}
        </button>
      ))}
    </div>
  )
}
