/** The fixed allergen list a menu item can declare. `MenuItem.allergens` stores these codes. Client-safe. */
export const allergens = ["GLUTEN", "DAIRY", "EGGS", "NUTS", "PEANUTS", "SOY", "SESAME"] as const
export type Allergen = (typeof allergens)[number]

export function isAllergen(value: string): value is Allergen {
  return (allergens as readonly string[]).includes(value)
}
