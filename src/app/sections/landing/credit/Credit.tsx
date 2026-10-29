import { Icon } from "@/components/ui/icons/Icon"
import type { Dict } from "@/lib/i18n"

const SITE = "https://ripunjoybuddha.com"

type CreditProps = {
  dict: Dict["landing"]["credit"]
}

/** The last line of the landing page: who built the app, with a link to their site. Quiet — muted, small, centred under a rule. */
export function Credit({ dict }: CreditProps) {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-2 border-t border-border pt-6 text-center text-small text-muted">
      <span className="inline-flex items-center gap-2">
        <Icon name="flame" className="size-4 shrink-0 text-o700" />
        <span>
          {dict.lead} <span className="font-semibold text-foreground">{dict.name}</span>
        </span>
      </span>
      <span aria-hidden>·</span>
      <a href={SITE} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center font-semibold text-o700 hover:underline">
        {dict.site}
      </a>
    </footer>
  )
}
