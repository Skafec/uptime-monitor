'use client'

import { useEffect, useState } from 'react'

const PASSWORD = process.env.NEXT_PUBLIC_ACCESS_PASSWORD
const SESSION_KEY = 'access_granted'

export default function AccessGuard({ children }: { children: React.ReactNode }) {
  const [granted, setGranted] = useState(false)

  useEffect(() => {
    if (!PASSWORD) {
      setGranted(true)
      return
    }

    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setGranted(true)
      return
    }

    const input = window.prompt('Enter password to access UptimeWatch:')
    if (input === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setGranted(true)
    } else {
      document.body.innerHTML = ''
    }
  }, [])

  if (!granted) return null
  return <>{children}</>
}
