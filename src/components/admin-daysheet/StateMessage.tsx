type StateMessageProps = {
  title: string
  body: string
}

/** The words of a SheetState, inside EmptyState's paragraph — spans, not a heading, so the markup stays valid. */
export function StateMessage({ title, body }: StateMessageProps) {
  return (
    <span className="flex flex-col gap-2">
      <span className="font-display text-h2 font-semibold text-foreground">{title}</span>
      <span className="text-pretty">{body}</span>
    </span>
  )
}
