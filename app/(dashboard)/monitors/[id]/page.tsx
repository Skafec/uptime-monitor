import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import UptimeChart from '@/components/UptimeChart'
import DeleteMonitorButton from '@/components/DeleteMonitorButton'
import ToggleMonitorButton from '@/components/ToggleMonitorButton'
import EditMonitorForm from '@/components/EditMonitorForm'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Authorise before touching monitor data: without a user, or scoped to
  // someone else's monitor, never surface the monitor's name in metadata.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { title: 'Monitor' }

  const { data: monitor } = await supabase
    .from('monitors')
    .select('name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  return { title: monitor?.name ?? 'Monitor' }
}

export default async function MonitorDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: monitor } = await supabase
    .from('monitors')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!monitor) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()
  const isPro = profile?.plan === 'pro'

  // Get last 90 days of checks
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: checks } = await supabase
    .from('monitor_checks')
    .select('*')
    .eq('monitor_id', id)
    .gte('checked_at', ninetyDaysAgo.toISOString())
    .order('checked_at', { ascending: false })

  // Get open incidents
  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .eq('monitor_id', id)
    .order('started_at', { ascending: false })
    .limit(10)

  const checksArr = checks ?? []
  const upCount = checksArr.filter((c) => c.status === 'up').length
  const uptime = checksArr.length > 0 ? ((upCount / checksArr.length) * 100).toFixed(2) : '100.00'

  const avgResponse =
    checksArr.length > 0
      ? Math.round(checksArr.reduce((sum, c) => sum + (c.response_time_ms ?? 0), 0) / checksArr.length)
      : 0

  const lastCheck = checksArr[0]

  return (
    <div className="fade-in">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{monitor.name}</h1>
              <StatusBadge status={monitor.last_status} />
            </div>
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {monitor.url} ↗
            </a>
          </div>

          <div className="flex items-center gap-2">
            <ToggleMonitorButton monitorId={monitor.id} isActive={monitor.is_active} />
            <DeleteMonitorButton monitorId={monitor.id} />
          </div>
        </div>
      </div>

      {/* Edit monitor */}
      <details className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
        <summary className="cursor-pointer select-none p-5 font-semibold text-sm text-gray-900 dark:text-white">
          Edit monitor
        </summary>
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-slate-800 pt-5">
          <EditMonitorForm
            monitorId={monitor.id}
            initialName={monitor.name}
            initialUrl={monitor.url}
            initialInterval={monitor.interval_minutes}
            isPro={isPro}
          />
        </div>
      </details>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Uptime (90d)',
            value: `${uptime}%`,
            color: parseFloat(uptime) > 99 ? 'text-green-600 dark:text-green-400' : parseFloat(uptime) > 95 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400',
          },
          {
            label: 'Avg Response',
            value: `${avgResponse}ms`,
            color: 'text-gray-900 dark:text-white',
          },
          {
            label: 'Total checks',
            value: checksArr.length.toLocaleString(),
            color: 'text-gray-900 dark:text-white',
          },
          {
            label: 'Last checked',
            value: lastCheck
              ? new Date(lastCheck.checked_at).toLocaleTimeString()
              : 'Never',
            color: 'text-gray-900 dark:text-white',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-4"
          >
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Uptime chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">90-day uptime</h2>
        <UptimeChart checks={checksArr} />
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
            <div className="w-3 h-3 bg-green-400 rounded-sm" />
            Operational
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
            <div className="w-3 h-3 bg-red-400 rounded-sm" />
            Downtime
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
            <div className="w-3 h-3 bg-gray-200 dark:bg-slate-700 rounded-sm" />
            No data
          </div>
        </div>
      </div>

      {/* Recent checks */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent checks</h2>
        {checksArr.length > 0 ? (
          <div className="space-y-2">
            {checksArr.slice(0, 20).map((check) => (
              <div
                key={check.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      check.status === 'up' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm text-gray-600 dark:text-slate-300">
                    {new Date(check.checked_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {check.status_code && (
                    <span className="text-gray-400 dark:text-slate-500">HTTP {check.status_code}</span>
                  )}
                  {check.response_time_ms && (
                    <span className={`font-mono ${check.response_time_ms > 2000 ? 'text-yellow-600' : 'text-gray-500 dark:text-slate-400'}`}>
                      {check.response_time_ms}ms
                    </span>
                  )}
                  <span
                    className={`font-medium ${
                      check.status === 'up'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {check.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">
            No checks yet. The first check will run within 5 minutes.
          </p>
        )}
      </div>

      {/* Incidents */}
      {incidents && incidents.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Incident history</h2>
          <div className="space-y-3">
            {incidents.map((incident) => {
              const duration = incident.resolved_at
                ? new Date(incident.resolved_at).getTime() - new Date(incident.started_at).getTime()
                : null

              return (
                <div
                  key={incident.id}
                  className="flex items-start justify-between py-3 border-b border-gray-50 dark:border-slate-800 last:border-0"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          incident.is_resolved ? 'bg-green-500' : 'bg-red-500 pulse-dot'
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {incident.is_resolved ? 'Resolved' : 'Ongoing'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Started: {new Date(incident.started_at).toLocaleString()}
                    </p>
                    {incident.resolved_at && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Resolved: {new Date(incident.resolved_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {duration && (
                    <span className="text-xs text-gray-400 dark:text-slate-500">
                      {Math.round(duration / 1000 / 60)}m downtime
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
