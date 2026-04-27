"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

// Sets the browser's IANA timezone in a cookie so server components can use it.
// Triggers one router.refresh() if the cookie is missing or stale.
export function TimezoneSyncer() {
  const router = useRouter()
  const synced = useRef(false)

  useEffect(() => {
    if (synced.current) return
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const encoded = encodeURIComponent(tz)
    const current = document.cookie.match(/(?:^|;\s*)tz=([^;]+)/)?.[1]
    if (current !== encoded) {
      document.cookie = `tz=${encoded}; path=/; max-age=31536000; SameSite=Lax`
      synced.current = true
      router.refresh()
    }
  }, [router])

  return null
}
