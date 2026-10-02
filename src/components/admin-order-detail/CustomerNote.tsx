type CustomerNoteProps = {
  note: string
  label: string
}

/**
 * Allergies live here, so it is impossible to miss: an orange-bordered warm block, semibold text,
 * a large quote mark. Never collapsed, never truncated.
 */
export function CustomerNote({ note, label }: CustomerNoteProps) {
  return (
    <section aria-label={label} className="flex gap-2 rounded-panel border border-o500 bg-o50 p-3">
      <span aria-hidden className="w-6 shrink-0 font-display text-h1 text-o700">
        “
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-micro font-semibold text-o700 uppercase">{label}</span>
        <p className="font-semibold text-pretty whitespace-pre-line">{note}</p>
      </div>
    </section>
  )
}
