'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  monitorId: string
  isActive: boolean
}

export default function ToggleMonitorButton({ monitorId, isActive }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(isActive)

  async function handleToggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/monitors/${monitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !active }),
      })

      if (res.ok) {
        setActive(!active)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : active ? 'Pause' : 'Resume'}
    </button>
  )
}
