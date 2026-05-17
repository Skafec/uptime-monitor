'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  monitorId: string
}

export default function DeleteMonitorButton({ monitorId }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/monitors/${monitorId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        confirming
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 border border-gray-200 dark:border-slate-700'
      }`}
    >
      {loading ? 'Deleting...' : confirming ? 'Confirm delete' : 'Delete'}
    </button>
  )
}
