type ItemTitleProps = {
  /** The header watches this element to know when to show the name itself. */
  id: string
  name: string
  description: string
}

/** The page's h1 and the one-line description under it. */
export function ItemTitle({ id, name, description }: ItemTitleProps) {
  return (
    <>
      <h1 id={id} className="text-h1 text-balance">
        {name}
      </h1>
      {description ? <p className="text-pretty text-muted">{description}</p> : null}
    </>
  )
}
