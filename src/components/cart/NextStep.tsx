import { Icon, type IconName } from "@/components/ui/icons/Icon"

type NextStepProps = {
  icon: IconName
  title: string
  body: string
}

/** One of "What happens next" — a warm icon square, the step, and when. */
export function NextStep({ icon, title, body }: NextStepProps) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-field bg-o50 text-o700">
        <Icon name={icon} className="size-4.5" />
      </span>
      <span className="flex flex-col">
        <span className="font-semibold">{title}</span>
        <span className="text-small text-muted">{body}</span>
      </span>
    </li>
  )
}
