'use client'

import { useEffect } from 'react'

/** Registers the offline service worker (production only, so development is never served stale files). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is a bonus: the site works without it.
    })
  }, [])
  return null
}
