/**
 * The bakery's Instagram and Facebook — stored as the part after the domain ("sabihabakery"), so a pasted link,
 * an @handle and a bare name all save the same. Client-safe: the settings form checks with these, the action re-checks.
 */

export type SocialKind = "instagram" | "facebook"

export const SOCIAL_KINDS: readonly SocialKind[] = ["instagram", "facebook"]

const hosts: Record<SocialKind, RegExp> = {
  instagram: /^(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\//i,
  facebook: /^(?:https?:\/\/)?(?:www\.|m\.|web\.)?(?:facebook|fb)\.com\//i,
}

/** Instagram's own rule; Facebook's usernames, or a profile without one. */
const valid: Record<SocialKind, RegExp> = {
  instagram: /^[A-Za-z0-9._]{1,30}$/,
  facebook: /^(?:[A-Za-z0-9.-]{1,80}|profile\.php\?id=\d{1,20})$/,
}

/** "https://www.instagram.com/sabihabakery/?igsh=…", "@sabihabakery" or "sabihabakery" → "sabihabakery". "" stays "". */
export function socialPath(kind: SocialKind, typed: string): string {
  const path = typed.trim().replace(hosts[kind], "").replace(/^@/, "")
  const profile = /^profile\.php\?(?:.*&)?id=(\d+)/.exec(path)
  if (kind === "facebook" && profile) return `profile.php?id=${profile[1]}`
  return path.replace(/[?#].*$/, "").replace(/\/+$/, "")
}

/** Empty is fine — it hides the link. */
export function socialValid(kind: SocialKind, typed: string): boolean {
  const path = socialPath(kind, typed)
  return path === "" || valid[kind].test(path)
}

/** The stored path → the link customers open, or null when there isn't one. */
export function socialUrl(kind: SocialKind, path: string | null): string | null {
  return path ? `https://www.${kind}.com/${path}` : null
}
