"use client"

import { Tag } from "@/components/ui/Tag"
import { priceToPaise } from "@/lib/menu/form"
import { formatPaise } from "@/lib/money"
import { PhotoImage } from "./PhotoImage"
import type { AdminCopy } from "./types"
import type { Fields, PhotoDraft } from "./useItemForm"

type ItemPreviewProps = {
  fields: Fields
  cover: PhotoDraft | null
  dict: AdminCopy
}

const names: Record<"set" | "placeholder", string> = {
  set: "text-foreground",
  placeholder: "text-subtle",
}

/**
 * What customers will see, as you type: the menu card, then the top of the item page (name, price,
 * allergens, the kitchen disclaimer). Customer sizes — 16px body, 16px card radius.
 */
export function ItemPreview({ fields, cover, dict }: ItemPreviewProps) {
  const p = dict.menuItem.previewPanel
  const paise = priceToPaise(fields.price)
  const price = paise === null ? dict.menuItem.basics.noPrice : formatPaise(paise)
  const unit = dict.priceUnits[fields.priceUnit]
  const name = fields.name.trim() || p.namePlaceholder
  const nameTone = names[fields.name.trim() ? "set" : "placeholder"]
  const description = fields.shortDescription.trim() || p.descriptionPlaceholder

  return (
    <div className="flex flex-col gap-3 text-body">
      <div className="flex w-full max-w-70 flex-col gap-2 rounded-card border border-border p-3">
        <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-panel bg-sunken">
          {cover && (cover.localUrl || cover.publicId) ? (
            <PhotoImage photo={cover} width={560} ratio="4:3" />
          ) : (
            <span className="text-small-admin text-subtle">{p.noCover}</span>
          )}
        </div>
        <span className={`font-medium ${nameTone}`}>{name}</span>
        <span className="text-small text-muted">{description}</span>
        <span className="font-semibold text-o700 tabular-nums">
          {price} {unit}
        </span>
      </div>

      <div className="flex flex-col gap-2 rounded-card border border-border p-4">
        <span className={`font-display text-h1 font-semibold ${nameTone}`}>{name}</span>
        <span className="text-muted">{description}</span>
        <span className="flex items-baseline gap-2">
          <span className="text-h1 font-semibold text-o700 tabular-nums">{price}</span>
          <span className="text-small text-muted">{unit}</span>
        </span>
        {fields.allergens.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {fields.allergens.map((allergen) => (
              <Tag key={allergen} tone="warm">
                {dict.allergens[allergen]}
              </Tag>
            ))}
          </div>
        ) : null}
        <span className="text-micro text-muted">{p.disclaimer}</span>
      </div>
    </div>
  )
}
