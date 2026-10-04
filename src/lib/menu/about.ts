/**
 * The item page's "About" text. The menu item form (AboutField) stores plain text with three marks —
 * **bold**, _italic_ and lines starting "• " — and never HTML; this turns it into blocks to render.
 * Each other non-empty line is its own paragraph. Client-safe, pure.
 */

export type AboutSpan = { text: string; bold: boolean; italic: boolean }

export type AboutBlock = { kind: "paragraph"; spans: AboutSpan[] } | { kind: "list"; items: AboutSpan[][] }

const BULLET = /^•\s*/
const BOLD = /(\*\*.+?\*\*)/
/** Underscores inside a word ("a_b_c") aren't italics. */
const ITALIC = /((?<!\w)_.+?_(?!\w))/

/** One line's text with its bold and italic runs. */
export function aboutSpans(line: string): AboutSpan[] {
  return line.split(BOLD).flatMap((part) => {
    const bold = /^\*\*(.+)\*\*$/.exec(part)
    return (bold ? bold[1] : part).split(ITALIC).flatMap((piece) => {
      if (!piece) return []
      const italic = /^_(.+)_$/.exec(piece)
      return [{ text: italic ? italic[1] : piece, bold: Boolean(bold), italic: Boolean(italic) }]
    })
  })
}

export function parseAbout(text: string): AboutBlock[] {
  const blocks: AboutBlock[] = []
  for (const raw of text.split("\n")) {
    const line = raw.trim()
    if (!line) continue
    if (BULLET.test(line)) {
      const spans = aboutSpans(line.replace(BULLET, ""))
      const last = blocks.at(-1)
      if (last?.kind === "list") last.items.push(spans)
      else blocks.push({ kind: "list", items: [spans] })
    } else {
      blocks.push({ kind: "paragraph", spans: aboutSpans(line) })
    }
  }
  return blocks
}
