/**
 * public/sw.js, production builds only — in dev it would serve stale /_next/static chunks over hot reload. A worker left
 * on the origin by an earlier `next start` does exactly that (hydration errors from old client code), so dev removes it
 * and its caches; the next load is clean. Browser-only.
 */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return
  if (process.env.NODE_ENV !== "production") {
    void clearServiceWorker()
    return
  }
  navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
    // No worker: the store still works and still installs — it just has no offline page.
  })
}

async function clearServiceWorker() {
  const registrations = await navigator.serviceWorker.getRegistrations()
  if (registrations.length === 0) return
  await Promise.all(registrations.map((registration) => registration.unregister()))
  if ("caches" in window) await Promise.all((await caches.keys()).map((key) => caches.delete(key)))
}
