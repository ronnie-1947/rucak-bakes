import { parseAbout } from "@/lib/menu/about"
import { AboutSpans } from "./AboutSpans"

type ItemAboutProps = {
  text: string
  title: string
  className?: string
}

/** The owner's longer text: a paragraph per line, "• " lines as a list, **bold** and _italic_ kept. Capped at a readable measure. */
export function ItemAbout({ text, title, className }: ItemAboutProps) {
  const blocks = parseAbout(text)
  if (blocks.length === 0) return null
  return (
    <section aria-labelledby="item-about" className={`flex max-w-2xl flex-col gap-3 ${className ?? ""}`}>
      <h2 id="item-about" className="text-h2">
        {title}
      </h2>
      {blocks.map((block, index) =>
        block.kind === "paragraph" ? (
          <p key={index} className="max-w-prose text-pretty">
            <AboutSpans spans={block.spans} />
          </p>
        ) : (
          <ul key={index} className="flex max-w-prose list-disc flex-col gap-1 pl-6">
            {block.items.map((spans, at) => (
              <li key={at} className="text-pretty">
                <AboutSpans spans={spans} />
              </li>
            ))}
          </ul>
        ),
      )}
    </section>
  )
}
