import { Icon } from "@/components/ui/icons/Icon"

type FixedSettingProps = {
  label: string
  value: string
  hint: string
  /** Why it can't be changed here. */
  fixed: string
}

/** A setting shown but not editable — currency and timezone are fixed when the app is set up. */
export function FixedSetting({ label, value, hint, fixed }: FixedSettingProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-small-admin text-muted">{label}</span>
      <span className="flex min-h-11 items-center gap-2 rounded-field border border-border bg-sunken px-3 tabular-nums">
        <Icon name="lock" className="size-4 shrink-0 text-muted" />
        <span className="min-w-0 truncate">{value}</span>
      </span>
      <span className="text-small-admin text-pretty text-muted">
        {hint} {fixed}
      </span>
    </div>
  )
}
