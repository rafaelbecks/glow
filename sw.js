/**
 * GLOW service worker — enables installability and a light offline shell.
 * App shell is cached; module/script updates prefer the network.
 */
const CACHE_NAME = 'glow-shell-v1'

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/assets/manifest.json',
  '/assets/glow-192.png',
  '/assets/glow-512.png',
  '/assets/glow-logo.svg',
  '/assets/glow-logo-with-o.svg',
  '/assets/cursor.svg'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Network-first so deploys show up quickly; fall back to cache offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached
          if (request.mode === 'navigate') {
            return caches.match('/index.html')
          }
          return undefined
        })
      )
  )
})
