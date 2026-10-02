import { signOutStaff } from "@/app/actions/auth"
import { Icon } from "@/components/ui/icons/Icon"
import { sidebarRow } from "./nav"

type SignOutButtonProps = {
  label: string
  /** `sidebar`: white-on-ink row · `list`: a row on the More screen. */
  tone: "sidebar" | "list"
}

const tones: Record<SignOutButtonProps["tone"], string> = {
  sidebar: `${sidebarRow} font-medium text-subtle hover:bg-background/10 hover:text-background`,
  list: "flex min-h-12 w-full items-center gap-3 px-4 text-left font-semibold text-red hover:bg-red-soft",
}

/** A form, so it works before hydration. */
export function SignOutButton({ label, tone }: SignOutButtonProps) {
  return (
    <form action={signOutStaff}>
      <button type="submit" className={tones[tone]}>
        <Icon name="logout" />
        <span>{label}</span>
      </button>
    </form>
  )
}
