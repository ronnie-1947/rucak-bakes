import { Icon, type IconName } from "@/components/ui/icons/Icon"

type HowStepProps = {
  icon: IconName
  title: string
  text: string
}

/** One step: a 32px o50 tile with an o500 glyph (decorative), then a bold line and a muted one. */
export function HowStep({ icon, title, text }: HowStepProps) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-chip bg-o50 text-o500">
        <Icon name={icon} className="size-4.5" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold">{title}</span>
        <span className="text-small text-pretty text-muted">{text}</span>
      </span>
    </li>
  )
}
