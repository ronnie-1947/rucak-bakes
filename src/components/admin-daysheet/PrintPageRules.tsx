type PrintPageRulesProps = {
  /** "Mill Lane Bakehouse · Saturday 3 Oct" — top left of every page after the first. */
  running: string
  /** "continued" — top right, beside it. */
  continued: string
  /** The day — bottom left of every page. */
  footer: string
  /** "Page {page} of {pages}" — bottom right; the placeholders become the printer's page counters. */
  pageTemplate: string
}

/** A CSS string literal. `<`, `>` and `&` go in as escapes, so nothing typed into Settings can close the style element. */
function cssString(text: string): string {
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[<>&]/g, (char) => `\\${char.charCodeAt(0).toString(16)} `)
    .replace(/\s+/g, " ")
  return `"${escaped}"`
}

/** "Page {page} of {pages}" → "Page " counter(page) " of " counter(pages) */
function pageContent(template: string): string {
  return template
    .split(/(\{page\}|\{pages\})/)
    .filter(Boolean)
    .map((part) => (part === "{page}" ? "counter(page)" : part === "{pages}" ? "counter(pages)" : cssString(part)))
    .join(" ")
}

/**
 * The printed day sheet's page furniture — "continued" headers and "Page 2 of 3" — drawn in the A4 page margins (`@page`
 * margin boxes; globals.css sets the page size). The words come from the dict, so they can't live in the stylesheet. Only
 * rendered with the day sheet, so no other page prints them. Browsers without margin boxes print the sheet without them.
 */
export function PrintPageRules({ running, continued, footer, pageTemplate }: PrintPageRulesProps) {
  const box = "font-family: var(--font-sans, sans-serif); font-size: 10pt; color: black;"
  const css = [
    "@page {",
    `  @top-left { content: ${cssString(running)}; ${box} font-weight: 700; }`,
    `  @top-right { content: ${cssString(continued)}; ${box} font-weight: 700; }`,
    `  @bottom-left { content: ${cssString(footer)}; ${box} }`,
    `  @bottom-right { content: ${pageContent(pageTemplate)}; ${box} }`,
    "}",
    "@page :first { @top-left { content: none; } @top-right { content: none; } }",
  ].join("\n")
  return <style>{css}</style>
}
