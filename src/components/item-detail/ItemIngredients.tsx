import { Tag } from "@/components/ui/Tag"

type ItemIngredientsProps = {
  ingredients: string[]
  title: string
  className?: string
}

/** The ingredients as quiet chips, in the owner's order. Left out when none are listed. */
export function ItemIngredients({ ingredients, title, className }: ItemIngredientsProps) {
  if (ingredients.length === 0) return null
  return (
    <section aria-labelledby="item-ingredients" className={`flex max-w-2xl flex-col gap-3 ${className ?? ""}`}>
      <h2 id="item-ingredients" className="text-h2">
        {title}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {ingredients.map((ingredient) => (
          <li key={ingredient} className="flex max-w-full">
            <Tag size="md">{ingredient}</Tag>
          </li>
        ))}
      </ul>
    </section>
  )
}
