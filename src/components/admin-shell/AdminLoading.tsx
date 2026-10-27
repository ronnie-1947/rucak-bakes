import { Spinner } from "@/components/ui/Spinner"

type AdminLoadingProps = {
  label: string
}

/** What `main` shows while a screen's data loads — the shell around it stays put. Rendered by the admin loading.tsx files. */
export function AdminLoading({ label }: AdminLoadingProps) {
  return (
    <div role="status" className="flex min-h-full flex-col items-center justify-center gap-3 p-6">
      <Spinner size="lg" />
      <p className="text-small-admin text-muted">{label}</p>
    </div>
  )
}
