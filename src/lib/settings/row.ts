import { cache } from "react"
import { prisma } from "@/lib/db"

/**
 * The singleton settings row, once per request. The seed creates it; a missing row is a deployment
 * error, so it throws rather than inventing defaults that would quietly disagree with the database.
 */
export const getSettings = cache(async () => {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } })
  if (!settings) throw new Error("The settings row is missing — run `pnpm exec prisma db seed`")
  return settings
})

/** For screens that must render before the seed has run (the login screen): null instead of a throw. */
export const findSettings = cache(() => prisma.settings.findUnique({ where: { id: 1 } }))
