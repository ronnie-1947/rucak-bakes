"use client"

import { AboutField } from "./AboutField"
import { AllergenPicker } from "./AllergenPicker"
import { FormSection } from "./FormSection"
import { IngredientInput } from "./IngredientInput"
import type { AdminCopy } from "./types"
import type { ItemForm } from "./useItemForm"

type DetailsSectionProps = {
  form: ItemForm
  ingredientSuggestions: string[]
  dict: AdminCopy
}

/** About (the item page's longer text), ingredients, and allergens. */
export function DetailsSection({ form, ingredientSuggestions, dict }: DetailsSectionProps) {
  const { fields, set } = form
  return (
    <FormSection id="details" title={dict.menuItem.details.title}>
      <AboutField value={fields.about} onChange={(about) => set("about", about)} dict={dict.menuItem} />
      <IngredientInput
        value={fields.ingredients}
        onChange={(ingredients) => set("ingredients", ingredients)}
        suggestions={ingredientSuggestions}
        dict={dict.menuItem.details}
      />
      <AllergenPicker value={fields.allergens} onChange={(allergens) => set("allergens", allergens)} dict={dict} />
    </FormSection>
  )
}
