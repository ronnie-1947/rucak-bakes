import { loadEnvConfig } from "@next/env"
import { defineConfig } from "prisma/config"

// Prisma 7 loads no .env on its own. Resolve it exactly as Next.js does (.env, .env.local, …),
// so the CLI and the app can never disagree about DATABASE_URL.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info: () => {}, error: console.error })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // process.env rather than env(): `prisma generate` runs in postinstall, before a fresh clone has a .env
    url: process.env.DATABASE_URL,
  },
})
