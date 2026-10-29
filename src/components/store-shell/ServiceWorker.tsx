"use client"

import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/pwa/register"

/** Registers public/sw.js once the shell mounts. Renders nothing. */
export function ServiceWorker() {
  useEffect(registerServiceWorker, [])
  return null
}
