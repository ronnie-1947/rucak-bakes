import { Fragment, type ReactNode } from "react"

type RichProps = {
  /** A dict string with `{name}` placeholders — "{email} isn’t set up for this bakery." */
  template: string
  /** Markup for each placeholder: a bold email, a tel: link. Unknown placeholders render as typed. */
  values: Record<string, ReactNode>
}

/** fill() for markup: keeps the sentence in the dict while a piece of it is bold or a link. */
export function Rich({ template, values }: RichProps) {
  const parts = template.split(/(\{\w+\})/)
  return (
    <>
      {parts.map((part, index) => {
        const key = /^\{(\w+)\}$/.exec(part)?.[1]
        return <Fragment key={index}>{key && key in values ? values[key] : part}</Fragment>
      })}
    </>
  )
}
