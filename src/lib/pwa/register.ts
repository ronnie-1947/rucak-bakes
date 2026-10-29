/** public/sw.js, production builds only — in dev it would serve stale /_next/static chunks over hot reload. Browser-only. */
export function registerServiceWorker() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
  navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
    // No worker: the store still works and still installs — it just has no offline page.
  })
}
