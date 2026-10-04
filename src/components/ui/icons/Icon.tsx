/** 24×24 stroke glyphs from the admin designs. Add a name here rather than a new icon file per glyph. */
const paths = {
  orders: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  daysheet: "M9 3h6v4H9zM6 5h12v16H6zM9 11h6M9 15h4",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  menu: "M4 12a8 6 0 0 1 16 0v7H4zM8 12v7M12 12v7M16 12v7",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  customers: "M17 20v-1a5 5 0 0 0-10 0v1M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1.1 1A16 16 0 0 1 4 5.1 1 1 0 0 1 5 4Z",
  chevronDown: "m6 9 6 6 6-6",
  chevronRight: "m9 6 6 6-6 6",
  chevronLeft: "m15 6-6 6 6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
  print: "M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  image: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  copy: "M8 8h12v12H8zM4 16V4h12",
  alert: "M12 9v4M12 17h.01M10.3 4.2 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z",
  pause: "M8 5v14M16 5v14",
  send: "M4 12 20 4l-6 16-3-7z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  pencil: "M4 20h4L19 9l-4-4L4 16v4Z",
  map: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  note: "M4 4h16v12H8l-4 4z",
  store: "M4 10h16v10H4zM3 10l2-6h14l2 6M9 20v-5h6v5",
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0",
  cart: "M9 21.4a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8zM18 21.4a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8zM2 3h3l2.6 12.4a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.3L21 7H6",
  check: "M20 6 9 17l-5-5",
  flame: "M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3 0-5 1-7.5Z",
  bag: "M6 7h12l1 13H5L6 7ZM9 7a3 3 0 0 1 6 0",
  close: "M6 6l12 12M18 6 6 18",
} as const

export type IconName = keyof typeof paths

type IconProps = {
  name: IconName
  className?: string
  strokeWidth?: number
}

export function Icon({ name, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "size-5"}
    >
      <path d={paths[name]} />
    </svg>
  )
}
