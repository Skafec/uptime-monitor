'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SlugForm({
  currentSlug,
  appUrl,
}: {
  currentSlug: string | null
  appUrl: string
}) {
  const router = useRouter()
  const [slug, setSlug] = useState(currentSlug ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    setSaved(false)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/settings/slug', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save')
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

  const previewUrl = `${appUrl}/status/${slug || 'your-brand'}`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {saved && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400 flex items-center justify-between">
          <span>Status page saved.</span>
          <Link
            href={`/status/${slug}`}
            target="_blank"
            className="font-medium underline underline-offset-2"
          >
            View it ↗
          </Link>
        </div>
      )}

      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"
        >
          Status page URL
        </label>
        <div className="flex items-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 dark:focus-within:ring-white transition-shadow">
          <span className="pl-3.5 pr-1 text-sm text-gray-400 dark:text-slate-500 whitespace-nowrap select-none">
            {appUrl}/status/
          </span>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={handleChange}
            required
            minLength={3}
            maxLength={30}
            placeholder="your-brand"
            className="flex-1 py-2.5 pr-3.5 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none text-sm"
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">
          Lowercase letters, numbers and hyphens only · 3–30 characters
        </p>
      </div>

      {slug.length >= 3 && (
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Preview:{' '}
          <span className="font-mono text-gray-700 dark:text-slate-300">{previewUrl}</span>
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || slug.length < 3}
          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : currentSlug ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  )
}
