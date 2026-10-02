import { type CountryCode, parsePhoneNumberFromString } from "libphonenumber-js"

/** Numbers typed without a country code are Indian. */
const DEFAULT_COUNTRY: CountryCode = "IN"

/**
 * Any way a customer types a number → E.164 ("+919876543210"), or null if it isn't one.
 * Accepts spaces, dashes, brackets, a leading 0 and a bare "91…". Normalise before any DB call.
 */
export function normalise(input: string, country: CountryCode = DEFAULT_COUNTRY): string | null {
  const parsed = parsePhoneNumberFromString(input, { defaultCountry: country })
  return parsed?.isValid() ? parsed.number : null
}

/** "+919876543210" → "+91 98765 43210". Returns the input untouched if it doesn't parse. */
export function formatForDisplay(e164: string): string {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164
}
