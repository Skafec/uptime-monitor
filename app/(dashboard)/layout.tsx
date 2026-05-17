import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, plan, status_page_slug')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Sidebar / top nav */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-green-500 rounded-md flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-white rounded-full pulse-dot" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">UptimeWatch</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Settings
              </Link>
              {profile?.status_page_slug && (
                <Link
                  href={`/status/${profile.status_page_slug}`}
                  target="_blank"
                  className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Status Page ↗
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {profile?.plan === 'free' && (
              <Link
                href="/api/stripe/checkout"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-medium bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 text-white dark:text-gray-900 px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Upgrade to Pro
              </Link>
            )}
            {profile?.plan === 'pro' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">
                Pro
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-slate-400 hidden sm:block truncate max-w-[160px]">
                {profile?.email || user.email}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
