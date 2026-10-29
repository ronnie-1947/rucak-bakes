/*
 * The store's service worker — registered from the store shell (src/lib/pwa/register.ts), scope "/".
 *
 * - /offline and the CSS, JS and fonts it needs: stored at install, in a cache of their own that is never trimmed.
 * - Build assets (/_next/static — content-hashed, never change) and the icons: cache first.
 * - Customer pages: network first, so prices and the menu are always live online. A copy of each page is kept
 *   for when the network is gone or too slow (a bakery basement) — and then it is served instead.
 * - Admin pages: network only, never stored (they hold customers' details), but they get the offline page too.
 * - Everything else passes straight through: /api, server actions (POST), RSC fetches, Cloudinary images.
 *
 * Change VERSION whenever this file's caching changes — activate drops every cache from older versions.
 */
const VERSION = "v1"
const OFFLINE_CACHE = `offline-${VERSION}`
const STATIC_CACHE = `static-${VERSION}`
const PAGES_CACHE = `pages-${VERSION}`
const OFFLINE = "/offline"
const SLOW_NETWORK_MS = 4000
const MAX_STATIC = 200
const MAX_PAGES = 30

self.addEventListener("install", (event) => {
  event.waitUntil(precacheOffline().then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  const current = [OFFLINE_CACHE, STATIC_CACHE, PAGES_CACHE]
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !current.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    if (url.pathname.startsWith("/api/")) return
    event.respondWith(url.pathname.startsWith("/admin") ? networkOnly(request) : networkFirst(event))
    return
  }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/favicon/") || url.pathname === "/logo.png") {
    event.respondWith(cacheFirst(event))
  }
})

/** The offline page, plus every /_next/static file its HTML names — so it renders styled with no network at all. */
async function precacheOffline() {
  const cache = await caches.open(OFFLINE_CACHE)
  const response = await fetch(OFFLINE, { cache: "reload" })
  if (!response.ok) return
  const html = await response.clone().text()
  const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? [])]
  await Promise.all(assets.map((asset) => cache.add(asset).catch(() => undefined)))
  await cache.put(OFFLINE, response)
}

async function cacheFirst(event) {
  const cached = await caches.match(event.request)
  if (cached) return cached
  const response = await fetch(event.request)
  if (response.ok) event.waitUntil(keep(STATIC_CACHE, event.request, response.clone(), MAX_STATIC))
  return response
}

/** Live when the network answers; the kept copy when it fails, or is still silent after SLOW_NETWORK_MS and a copy exists. */
async function networkFirst(event) {
  const { request } = event
  const cached = await caches.match(request, { cacheName: PAGES_CACHE })
  const network = fetch(request).then((response) => {
    if (response.ok && response.type === "basic") event.waitUntil(keep(PAGES_CACHE, request, response.clone(), MAX_PAGES))
    return response
  })
  // The race below may settle on the copy first; a network failure after that is expected, not an error.
  network.catch(() => undefined)
  try {
    if (!cached) return await network
    return await Promise.race([network, new Promise((resolve) => setTimeout(() => resolve(cached), SLOW_NETWORK_MS))])
  } catch {
    return cached ?? (await offlinePage())
  }
}

async function networkOnly(request) {
  try {
    return await fetch(request)
  } catch {
    return offlinePage()
  }
}

async function offlinePage() {
  return (await caches.match(OFFLINE, { cacheName: OFFLINE_CACHE })) ?? Response.error()
}

/** Store a response, then drop the oldest entries past `max` — keys come back in insertion order. */
async function keep(cacheName, request, response, max) {
  const cache = await caches.open(cacheName)
  await cache.put(request, response)
  const keys = await cache.keys()
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)))
}
