'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditMonitorForm({
  monitorId,
  initialName,
  initialUrl,
  initialInterval,
  isPro = false,
}: {
  monitorId: string
  initialName: string
  initialUrl: string
  initialInterval: number
  isPro?: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [url, setUrl] = useState(initialUrl)
  const [intervalMinutes, setIntervalMinutes] = useState(initialInterval)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    // Only send interval_minutes if it actually changed — the PATCH route
    // rejects any interval change for free users, so an unchanged 5-min free
    // monitor must not include it (editing name/URL should still work).
    const body: Record<string, unknown> = { name: name.trim(), url: normalizedUrl }
    if (intervalMinutes !== initialInterval) {
      body.interval_minutes = intervalMinutes
    }

    try {
      const res = await fetch(`/api/monitors/${monitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update monitor')
        return
      }
      setSaved(true)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {saved && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
          Changes saved.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            Name
          </label>
          <input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-shadow text-sm"
          />
        </div>
        <div>
          <label htmlFor="edit-url" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            URL
          </label>
          <input
            id="edit-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-shadow text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="edit-interval" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
          Check interval
        </label>
        <select
          id="edit-interval"
          value={intervalMinutes}
          onChange={(e) => setIntervalMinutes(Number(e.target.value))}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-shadow text-sm"
        >
          <option value={5}>Every 5 minutes</option>
          <option value={1} disabled={!isPro}>
            Every 1 minute{!isPro ? ' — Pro' : ''}
          </option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
