'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

export default function DeleteAccountButton() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to delete account. Please try again.')
        setLoading(false)
        return
      }
      // Clear any local session, then leave the app.
      await createBrowserSupabaseClient().auth.signOut()
      router.push('/')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
      >
        Delete account
      </button>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      <p className="text-sm text-gray-600 dark:text-slate-300">
        This permanently deletes your account, all your monitors, their check history, and cancels
        any active subscription. This cannot be undone. Type <span className="font-semibold">DELETE</span> to confirm.
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="DELETE"
        className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleDelete}
          disabled={confirmText !== 'DELETE' || loading}
          className="inline-flex items-center text-sm font-medium text-white bg-red-600 px-4 py-2 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Deleting…' : 'Permanently delete account'}
        </button>
        <button
          onClick={() => {
            setConfirming(false)
            setConfirmText('')
            setError('')
          }}
          disabled={loading}
          className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
