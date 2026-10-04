import { Fragment } from "react"
import type { AboutSpan } from "@/lib/menu/about"

type AboutSpansProps = {
  spans: AboutSpan[]
}

/** One line of About text: plain runs as text, **bold** as strong (600 — the scale's heaviest), _italic_ as em. */
export function AboutSpans({ spans }: AboutSpansProps) {
  return (
    <>
      {spans.map((span, index) => {
        const text = span.italic ? <em>{span.text}</em> : span.text
        return span.bold ? (
          <strong key={index} className="font-semibold">
            {text}
          </strong>
        ) : (
          <Fragment key={index}>{text}</Fragment>
        )
      })}
    </>
  )
}
