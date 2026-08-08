/**
 * PWA bootstrap — service worker registration + File Handling helpers.
 */

export function registerServiceWorker () {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null)

  return navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .catch((err) => {
      console.warn('Service worker registration failed:', err)
      return null
    })
}

/**
 * Whether the File Handling / Launch Queue API is available.
 */
export function supportsFileHandling () {
  return 'launchQueue' in window
}

/**
 * Register a consumer for OS-launched files (installed PWA file associations).
 * Launches are queued until this is set, so call after the app is ready.
 * @param {(fileHandle: FileSystemFileHandle) => void|Promise<void>} handler
 */
export function setupLaunchQueue (handler) {
  if (!supportsFileHandling() || typeof handler !== 'function') return

  window.launchQueue.setConsumer((launchParams) => {
    if (!launchParams?.files?.length) return
    launchParams.files.forEach((fileHandle) => {
      Promise.resolve(handler(fileHandle)).catch((err) => {
        console.error('Failed to handle launched file:', err)
      })
    })
  })
}
