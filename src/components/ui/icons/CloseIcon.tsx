type CloseIconProps = {
  className?: string
}

export function CloseIcon({ className }: CloseIconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className ?? "size-5"}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}
