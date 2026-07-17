import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import MonitorCard from '@/components/MonitorCard'
import AddMonitorForm from '@/components/AddMonitorForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: monitors } = await supabase
    .from('monitors')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const monitorCount = monitors?.length ?? 0
  const isPro = profile?.plan === 'pro'
  const canAddMore = isPro || monitorCount < 3

  const upCount = monitors?.filter((m) => m.last_status === 'up').length ?? 0
  const downCount = monitors?.filter((m) => m.last_status === 'down').length ?? 0
  const pausedCount = monitors?.filter((m) => !m.is_active).length ?? 0
  // A downgraded free user can hold more than 3 monitors (excess paused), so
  // clamp the "remaining" count so it never goes negative.
  const freeRemaining = Math.max(0, 3 - monitorCount)

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monitors</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {monitorCount} monitor{monitorCount !== 1 ? 's' : ''}
            {pausedCount > 0 && ` · ${pausedCount} paused`}
            {!isPro && ` · ${freeRemaining} remaining on free plan`}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {downCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full pulse-dot" />
              <span className="text-red-600 dark:text-red-400 font-medium">{downCount} down</span>
            </div>
          )}
          {upCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-green-600 dark:text-green-400 font-medium">{upCount} up</span>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade banner */}
      {!isPro && monitorCount >= 2 && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 dark:from-slate-800 dark:to-slate-700 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-medium text-sm">You&apos;re approaching your free plan limit</p>
            <p className="text-xs opacity-70 mt-0.5">Upgrade to Pro for unlimited monitors + 1-minute checks</p>
          </div>
          <a
            href="/api/stripe/checkout"
            className="flex-shrink-0 text-sm font-medium bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Upgrade to Pro — $9/mo
          </a>
        </div>
      )}

      {/* Paused-over-limit notice */}
      {!isPro && pausedCount > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-sm text-amber-800 dark:text-amber-300">
          {pausedCount} monitor{pausedCount !== 1 ? 's are' : ' is'} paused — the free plan runs 3 active monitors.{' '}
          <a href="/api/stripe/checkout" className="font-medium underline">Upgrade to Pro</a> or delete some to reactivate.
        </div>
      )}

      {/* Monitors grid */}
      {monitors && monitors.length > 0 ? (
        <div className="grid gap-4 mb-8">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 mb-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No monitors yet</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            Add your first URL below to start monitoring it every 5 minutes.
          </p>
        </div>
      )}

      {/* Add monitor form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Add new monitor</h2>
        {canAddMore ? (
          <AddMonitorForm isPro={isPro} />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              You&apos;ve reached the free plan limit of 3 monitors.
            </p>
            <a
              href="/api/stripe/checkout"
              className="inline-flex items-center text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
            >
              Upgrade to Pro for unlimited monitors
            </a>
          </div>
        )}
      </div>

      {/* Status page setup */}
      {!profile?.status_page_slug && (
        <div className="mt-4 p-4 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Set up your public{' '}
            <a href="/settings" className="text-gray-900 dark:text-white font-medium hover:underline">
              status page
            </a>
            {' '}to share uptime with your customers.
          </p>
        </div>
      )}
    </div>
  )
}
