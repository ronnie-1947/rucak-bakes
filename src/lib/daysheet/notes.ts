/**
 * Allergies live in the customer's free-text note — the order has no allergy field. A note that names an
 * allergen (or says "allergy") is lifted to the top of the day sheet's notes and drawn red, so it can't be
 * read past. Matching is whole words, so "Nutan" is not "nut".
 *
 * This only ever promotes a note: one it misses still shows in the same notes box, in the order's
 * normal place. The words are English because customers type in English — a second locale would need
 * its own list.
 */
const ALLERGEN_WORDS =
  /\b(allerg\w*|anaphyla\w*|intoleran\w*|epipen|nuts?|nutty|peanuts?|walnuts?|almonds?|cashews?|pistachios?|hazelnuts?|pecans?|gluten\w*|coeliac|celiac|wheat|eggs?|eggless|dairy|lactose|milk|soy|soya|sesame)\b/i

export function mentionsAllergen(note: string): boolean {
  return ALLERGEN_WORDS.test(note)
}
