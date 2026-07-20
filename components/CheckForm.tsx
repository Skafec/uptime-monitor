'use client'

import { useState } from 'react'
import Link from 'next/link'

type Result = {
  url: string
  status: 'up' | 'down'
  statusCode: number | null
  responseTimeMs: number
}

export default function CheckForm() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setResult(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          placeholder="example.com"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-shadow"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Checking…' : 'Check'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                result.status === 'up' ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {result.status === 'up' ? 'It’s up!' : 'It looks down.'}
            </p>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 break-all">{result.url}</p>
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500">Status code</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {result.statusCode ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500">Response time</p>
              <p className="font-medium text-gray-900 dark:text-white">{result.responseTimeMs} ms</p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800">
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
              Want to know the moment it goes down? Monitor it 24/7 with email alerts — free.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Monitor this URL for free →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
