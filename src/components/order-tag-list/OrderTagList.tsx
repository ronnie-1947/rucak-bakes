import { Tag, type TagTone } from "@/components/ui/Tag"
import type { Dict } from "@/lib/i18n"
import type { OrderTags } from "@/lib/orders/queries"
import { fill } from "@/lib/template"

type OrderTagListProps = {
  tags: OrderTags
  dict: Dict["admin"]["orderTags"]
  /** Which facts to show. The detail page leaves out delivery and note — it shows them in full. */
  include?: (keyof OrderTags)[]
  /** Table cells: the first tag, abbreviated, then "+n". */
  compact?: boolean
  className?: string
}

const ORDER: (keyof OrderTags)[] = ["suspected", "before", "trusted", "noShows", "delivery", "note", "staff", "customPrice"]

/** The facts staff weigh before calling: history, trust, no-shows, what kind of order it is, and whether staff entered it. */
export function OrderTagList({ tags, dict, include = ORDER, compact = false, className }: OrderTagListProps) {
  const items: { key: keyof OrderTags; label: string; tone: TagTone }[] = []
  for (const key of ORDER) {
    if (!include.includes(key)) continue
    if (key === "suspected" && tags.suspected) items.push({ key, label: dict.suspected, tone: "red" })
    if (key === "before" && tags.before > 0) {
      items.push({ key, label: fill(compact ? dict.beforeShort : dict.before, { count: tags.before }), tone: "warm" })
    }
    if (key === "trusted" && tags.trusted) items.push({ key, label: dict.trusted, tone: "green" })
    if (key === "noShows" && tags.noShows > 0) {
      items.push({ key, label: tags.noShows === 1 ? dict.noShowsOne : fill(dict.noShows, { count: tags.noShows }), tone: "red" })
    }
    if (key === "delivery" && tags.delivery) items.push({ key, label: dict.delivery, tone: "neutral" })
    if (key === "note" && tags.note) items.push({ key, label: dict.note, tone: "neutral" })
    if (key === "staff" && tags.staff) items.push({ key, label: fill(dict.staff, { name: tags.staff }), tone: "neutral" })
    if (key === "customPrice" && tags.customPrice) items.push({ key, label: dict.customPrice, tone: "warm" })
  }
  if (items.length === 0) return null

  const shown = compact ? items.slice(0, 1) : items
  const hidden = items.length - shown.length

  return (
    <span className={`flex min-w-0 flex-wrap gap-1 ${className ?? ""}`}>
      {shown.map((item) => (
        <Tag key={item.key} tone={item.tone}>
          {item.label}
        </Tag>
      ))}
      {hidden > 0 ? (
        <Tag tone="quiet" className="cursor-help">
          <span title={items.map((item) => item.label).join(" · ")}>{fill(dict.more, { count: hidden })}</span>
        </Tag>
      ) : null}
    </span>
  )
}
