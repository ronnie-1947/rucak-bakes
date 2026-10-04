import { Field } from "@/components/ui/Field"
import { inputClasses } from "@/components/ui/TextInput"
import { NOTE_MAX } from "@/lib/orders/checkout"

type NoteFieldProps = {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder: string
}

/** The order's note — where allergies are written, so it reaches the owner's Telegram message and the day sheet. */
export function NoteField({ value, onChange, label, placeholder }: NoteFieldProps) {
  const id = "cart-note"
  const near = value.length > NOTE_MAX - 100
  return (
    <Field id={id} label={label} counter={near ? `${value.length} / ${NOTE_MAX}` : undefined}>
      <textarea
        id={id}
        rows={3}
        value={value}
        maxLength={NOTE_MAX}
        placeholder={placeholder}
        aria-describedby={near ? `${id}-message` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={inputClasses(false, "resize-y py-3")}
      />
    </Field>
  )
}
