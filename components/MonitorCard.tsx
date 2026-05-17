import Link from 'next/link'
import StatusBadge from './StatusBadge'
import type { Database } from '@/lib/supabase'

type Monitor = Database['public']['Tables']['monitors']['Row']

interface Props {
  monitor: Monitor
}

export default function MonitorCard({ monitor }: Props) {
  const lastChecked = monitor.last_checked_at
    ? getRelativeTime(new Date(monitor.last_checked_at))
    : 'Never checked'

  return (
    <Link
      href={`/monitors/${monitor.id}`}
      className="group block bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 transition-all hover:shadow-sm p-4 sm:p-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              monitor.last_status === 'up'
                ? 'bg-green-500'
                : monitor.last_status === 'down'
                ? 'bg-red-500 pulse-dot'
                : 'bg-gray-300 dark:bg-slate-600'
            }`}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">{monitor.name}</h3>
              {!monitor.is_active && (
                <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  Paused
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 dark:text-slate-500 truncate mt-0.5">{monitor.url}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          <div className="hidden sm:block text-right">
            <p className="text-xs text-gray-400 dark:text-slate-500">Last checked</p>
            <p className="text-sm text-gray-600 dark:text-slate-300">{lastChecked}</p>
          </div>
          <StatusBadge status={monitor.last_status} />
          <svg
            className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-gray-500 dark:group-hover:text-slate-400 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 1000 / 60)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
