"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireStaff } from "@/auth"
import { changeFlag, type FlagOutcome, type FlagSnapshot, renameCustomer as rename, restoreFlags, saveCustomerNote as saveNote } from "@/lib/customers/changes"
import { CUSTOMER_LIMITS } from "@/lib/customers/limits"
import { type CustomerLookup, lookupCustomer } from "@/lib/customers/lookup"
import { normalise } from "@/lib/phone"

/**
 * The customer screens' server actions. Flags show across admin — the orders queue tags trusted and
 * blocked numbers — so every change revalidates the admin layout.
 */

const id = z.string().min(1).max(40)

function refresh() {
  revalidatePath("/admin", "layout")
}

type Invalid = { ok: false; reason: "INVALID" }
const invalid: Invalid = { ok: false, reason: "INVALID" }

const flagInput = z.object({ id, change: z.enum(["trust", "untrust", "block", "unblock"]) })

/** Mark trusted / Remove trusted / Block / Unblock — after the confirm that says what it does. */
export async function setCustomerFlag(input: z.input<typeof flagInput>): Promise<FlagOutcome | Invalid> {
  await requireStaff()
  const parsed = flagInput.safeParse(input)
  if (!parsed.success) return invalid
  const result = await changeFlag(parsed.data.id, parsed.data.change)
  if (result.ok) refresh()
  return result
}

const snapshotInput = z.object({ id, isTrusted: z.boolean(), isBlocked: z.boolean() })

/** The undo strip's Undo: the flags exactly as they were. */
export async function undoCustomerFlag(input: FlagSnapshot): Promise<{ ok: boolean }> {
  await requireStaff()
  const parsed = snapshotInput.safeParse(input)
  if (!parsed.success) return { ok: false }
  const ok = await restoreFlags(parsed.data)
  if (ok) refresh()
  return { ok }
}

const nameInput = z.object({ id, name: z.string().trim().min(1).max(CUSTOMER_LIMITS.name) })

export async function renameCustomer(input: z.input<typeof nameInput>): Promise<{ ok: boolean }> {
  await requireStaff()
  const parsed = nameInput.safeParse(input)
  if (!parsed.success) return { ok: false }
  const ok = await rename(parsed.data.id, parsed.data.name)
  if (ok) refresh()
  return { ok }
}

const noteInput = z.object({ id, note: z.string().trim().max(CUSTOMER_LIMITS.note) })

export async function saveCustomerNote(input: z.input<typeof noteInput>): Promise<{ ok: boolean }> {
  await requireStaff()
  const parsed = noteInput.safeParse(input)
  if (!parsed.success) return { ok: false }
  const ok = await saveNote(parsed.data.id, parsed.data.note)
  if (ok) revalidatePath(`/admin/customers/${parsed.data.id}`)
  return { ok }
}

const phoneInput = z.string().trim().min(1).max(20)

/**
 * The staff order form's lookup (7R.5), as soon as the phone field holds a full number: the customer with exactly that
 * number, or null — a new customer, created when the order is added.
 */
export async function findCustomerByPhone(phone: string): Promise<CustomerLookup | null> {
  await requireStaff()
  const parsed = phoneInput.safeParse(phone)
  const phoneE164 = parsed.success ? normalise(parsed.data) : null
  if (!phoneE164) return null
  return lookupCustomer({ phoneE164 })
}
