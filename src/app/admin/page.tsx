import { redirect } from "next/navigation"
import { ADMIN_HOME } from "@/lib/admin-routes"

/** /admin has no screen of its own — the orders queue is home. */
export default function AdminIndex() {
  redirect(ADMIN_HOME)
}
