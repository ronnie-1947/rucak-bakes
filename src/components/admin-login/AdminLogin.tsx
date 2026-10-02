import Link from "next/link"
import { LoginForm } from "./LoginForm"
import type { LoginCopy, LoginState, OwnerPhone } from "./types"
import { Wordmark } from "./Wordmark"

type AdminLoginProps = {
  dict: LoginCopy
  bakeryName: string
  ownerPhone: OwnerPhone
  state: LoginState
  email: string | null
  destination: string
  callbackUrl: string
}

/** The /admin/login screen: wordmark, one card, a way back to the shop. The card never grows past 400px. */
export function AdminLogin({ dict, bakeryName, ownerPhone, state, email, destination, callbackUrl }: AdminLoginProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-6 md:px-8">
      <Wordmark name={bakeryName} />

      <section aria-labelledby="login-title" className="flex w-full max-w-100 flex-col rounded-card border border-border bg-background p-6 md:p-8">
        <h1 id="login-title" className="text-h1">
          {dict.title}
        </h1>
        <p className="mt-1 text-muted">{dict.subtitle}</p>
        <LoginForm dict={dict} state={state} email={email} destination={destination} callbackUrl={callbackUrl} ownerPhone={ownerPhone} />
      </section>

      <footer className="flex flex-col items-center text-small text-muted">
        <span>{bakeryName}</span>
        <Link href="/" className="flex min-h-11 items-center font-medium text-o700 hover:underline">
          {dict.back}
        </Link>
      </footer>
    </main>
  )
}
