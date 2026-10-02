type CheckIconProps = {
  className?: string
}

export function CheckIcon({ className }: CheckIconProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "size-4"}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
