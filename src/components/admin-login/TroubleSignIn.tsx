"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { HelpSteps } from "./HelpSteps"
import type { LoginCopy, OwnerPhone } from "./types"

type TroubleSignInProps = {
  dict: LoginCopy["help"]
  ownerPhone: OwnerPhone
}

/** "Trouble signing in?" — a bottom sheet on phones, a centred dialog from 640px. */
export function TroubleSignIn({ dict, ownerPhone }: TroubleSignInProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="link" size="inline" onClick={() => setOpen(true)} className="mt-2 self-start">
        {dict.open}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={dict.title} closeLabel={dict.close}>
        <HelpSteps dict={dict} ownerPhone={ownerPhone} />
      </Dialog>
    </>
  )
}
