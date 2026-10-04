import { Icon } from "@/components/ui/icons/Icon"
import { Tag } from "@/components/ui/Tag"
import type { Dict } from "@/lib/i18n"
import type { Allergen } from "@/lib/menu/allergens"

type ItemAllergensProps = {
  allergens: Allergen[]
  labels: Dict["store"]["allergens"]
  dict: Pick<Dict["store"]["itemPage"], "allergens" | "noAllergens" | "disclaimer">
  className?: string
}

/**
 * The declared allergens as warm chips on a bordered card, set apart from the plain sections around it. Always
 * shown: the kitchen disclaimer holds even when the owner declared none.
 */
export function ItemAllergens({ allergens, labels, dict, className }: ItemAllergensProps) {
  return (
    <section aria-labelledby="item-allergens" className={`flex max-w-2xl flex-col gap-3 rounded-card border border-border-strong p-4 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <Icon name="alert" className="size-5 shrink-0 text-o700" />
        <h2 id="item-allergens" className="text-h2">
          {dict.allergens}
        </h2>
      </div>
      {allergens.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {allergens.map((allergen) => (
            <li key={allergen} className="flex">
              <Tag tone="warm" size="md" className="font-semibold">
                {labels[allergen]}
              </Tag>
            </li>
          ))}
        </ul>
      ) : (
        <p>{dict.noAllergens}</p>
      )}
      <p className="text-small text-pretty text-muted">{dict.disclaimer}</p>
    </section>
  )
}
