type GalleryDotsProps = {
  count: number
  index: number
}

const dots: Record<"current" | "other", string> = {
  current: "bg-o500",
  other: "bg-border-strong",
}

/** Which photo is showing, on a white pill at the carousel's foot. Below 1024px only — the rail takes over there. Decorative: each slide is labelled. */
export function GalleryDots({ count, index }: GalleryDotsProps) {
  return (
    <div aria-hidden className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-pill bg-background px-3 py-2 lg:hidden">
      {Array.from({ length: count }, (_, at) => (
        <span key={at} className={`size-2 rounded-pill ${dots[at === index ? "current" : "other"]}`} />
      ))}
    </div>
  )
}
