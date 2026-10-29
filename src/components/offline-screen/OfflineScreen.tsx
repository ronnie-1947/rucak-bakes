import { ButtonLink } from "@/components/ui/ButtonLink"
import { Container } from "@/components/ui/Container"
import { Icon } from "@/components/ui/icons/Icon"
import type { Dict } from "@/lib/i18n"
import { RetryButton } from "./RetryButton"

type OfflineScreenProps = {
  dict: Dict["offline"]
}

/**
 * What the service worker serves for a page it can't reach and has no copy of. The address bar still shows that
 * page, so Try again — or coming back online — reloads it. No store shell: it must render from the worker's cache
 * alone, for admin pages too.
 */
export function OfflineScreen({ dict }: OfflineScreenProps) {
  return (
    <Container as="main" width="narrow" className="flex flex-1 flex-col items-center justify-center gap-6 py-12 text-center">
      <span aria-hidden className="grid size-16 place-items-center rounded-pill bg-o50 text-o700">
        <Icon name="wifiOff" className="size-8" />
      </span>
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="text-h1">{dict.title}</h1>
        <p className="text-pretty text-muted">{dict.body}</p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-2">
        <RetryButton label={dict.retry} />
        <ButtonLink href="/" variant="link" size="lg">
          {dict.home}
        </ButtonLink>
      </div>
    </Container>
  )
}
