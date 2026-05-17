import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceSupabaseClient } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import UptimeChart from '@/components/UptimeChart'
import { calculateUptimePercentage } from '@/lib/monitor'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('status_page_slug', slug)
    .single()

  if (!profile) {
    return { title: 'Status Page Not Found' }
  }

  const orgName = profile.email.split('@')[0]

  return {
    title: `${orgName} System Status | Powered by UptimeWatch`,
    description: `Live uptime status for ${orgName}'s services. Check if any systems are currently experiencing issues.`,
    openGraph: {
      title: `${orgName} System Status`,
      description: `Live uptime and incident status for ${orgName}'s services.`,
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function StatusPage({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceSupabaseClient()

  // Find user by status page slug
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('status_page_slug', slug)
    .single()

  if (!profile) {
    notFound()
  }

  // Get all monitors for this user (public — no auth required)
  const { data: monitors } = await supabase
    .from('monitors')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .order('name')

  if (!monitors) {
    notFound()
  }

  // Get 90 days of checks for each monitor
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const monitorsWithChecks = await Promise.all(
    monitors.map(async (monitor) => {
      const { data: checks } = await supabase
        .from('monitor_checks')
        .select('checked_at, status')
        .eq('monitor_id', monitor.id)
        .gte('checked_at', ninetyDaysAgo.toISOString())
        .order('checked_at', { ascending: false })

      return {
        ...monitor,
        checks: checks ?? [],
      }
    })
  )

  const orgName = profile.email.split('@')[0]
  const allUp = monitors.every((m) => m.last_status === 'up')
  const anyDown = monitors.some((m) => m.last_status === 'down')
  const hasMonitors = monitors.length > 0

  const overallStatus = !hasMonitors
    ? 'unknown'
    : allUp
    ? 'up'
    : anyDown
    ? 'down'
    : 'unknown'

  const lastUpdated = new Date().toUTCString()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {orgName} Status
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>

          {/* Overall status banner */}
          <div
            className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
              overallStatus === 'up'
                ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                : overallStatus === 'down'
                ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                : 'bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                overallStatus === 'up'
                  ? 'bg-green-500'
                  : overallStatus === 'down'
                  ? 'bg-red-500 pulse-dot'
                  : 'bg-gray-400'
              }`}
            />
            <span
              className={`font-medium ${
                overallStatus === 'up'
                  ? 'text-green-800 dark:text-green-300'
                  : overallStatus === 'down'
                  ? 'text-red-800 dark:text-red-300'
                  : 'text-gray-700 dark:text-slate-300'
              }`}
            >
              {overallStatus === 'up'
                ? 'All systems operational'
                : overallStatus === 'down'
                ? 'Some systems are experiencing issues'
                : hasMonitors
                ? 'Status unknown'
                : 'No services monitored yet'}
            </span>
          </div>
        </div>
      </header>

      {/* Monitors */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {monitorsWithChecks.length > 0 ? (
          <div className="space-y-4">
            {monitorsWithChecks.map((monitor) => {
              const uptime = calculateUptimePercentage(monitor.checks)

              return (
                <div
                  key={monitor.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5"
                >
                  {/* Monitor header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white">{monitor.name}</h2>
                      <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5 truncate max-w-xs">
                        {monitor.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
                        {uptime}% uptime
                      </span>
                      <StatusBadge status={monitor.last_status} />
                    </div>
                  </div>

                  {/* Uptime chart */}
                  <UptimeChart checks={monitor.checks} />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              No services are being monitored yet.
            </p>
          </div>
        )}

        {/* Incident history note */}
        {anyDown && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400">
              One or more services are currently experiencing issues. Our team has been notified and is investigating.
            </p>
          </div>
        )}
      </main>

      {/* Footer — backlink generator */}
      <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-8 mt-4">
        <div className="text-center">
          <p className="text-sm text-gray-400 dark:text-slate-500">
            Powered by{' '}
            <Link
              href={process.env.NEXT_PUBLIC_APP_URL || 'https://uptimewatch.io'}
              className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              target="_blank"
              rel="noopener"
            >
              UptimeWatch
            </Link>
            {' '}— uptime monitoring for everyone
          </p>
          <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://uptimewatch.io'}/signup`}
              className="hover:underline"
              target="_blank"
              rel="noopener"
            >
              Create your own free status page
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
