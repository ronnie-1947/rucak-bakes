type WordmarkProps = {
  /** settings.bakeryName — the last word carries the orange underline. */
  name: string
}

export function Wordmark({ name }: WordmarkProps) {
  const words = name.trim().split(/\s+/)
  const last = words.pop()
  return (
    <p className="text-center font-display text-h1 font-semibold">
      {words.length > 0 ? `${words.join(" ")} ` : null}
      <span className="border-b-3 border-o500">{last}</span>
    </p>
  )
}
