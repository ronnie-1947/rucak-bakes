"use client"

import { SaveActions } from "./SaveActions"
import { SaveStatus } from "./SaveStatus"
import type { ItemCopy } from "./types"
import type { ItemForm } from "./useItemForm"

type SaveCardProps = {
  form: ItemForm
  creating: boolean
  dict: ItemCopy
}

/** From 1024px: status and Save at the top of the sticky right column, always in view. */
export function SaveCard({ form, creating, dict }: SaveCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-panel border border-border p-3">
      <SaveStatus form={form} dict={dict} />
      <SaveActions form={form} creating={creating} dict={dict.save} />
    </div>
  )
}
