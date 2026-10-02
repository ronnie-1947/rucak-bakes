"use client"

import { SaveActions } from "./SaveActions"
import { SaveStatus } from "./SaveStatus"
import type { ItemCopy } from "./types"
import type { ItemForm } from "./useItemForm"

type SaveBarProps = {
  form: ItemForm
  creating: boolean
  dict: ItemCopy
}

/**
 * Below 1024px: sticks to the bottom of the scroll area once there's something to save (or just was),
 * clear of the home indicator.
 */
export function SaveBar({ form, creating, dict }: SaveBarProps) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-background px-4 pt-3 pb-safe shadow-raised md:px-6 lg:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-40 flex-1">
          <SaveStatus form={form} dict={dict} />
        </div>
        <SaveActions form={form} creating={creating} dict={dict.save} />
      </div>
    </div>
  )
}
