import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import SlugForm from '@/components/SlugForm'
import DeleteAccountButton from '@/components/DeleteAccountButton'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Settings — UptimeWatch',
}

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, status_page_slug, stripe_customer_id')
    .eq('id', user.id)
    .single()

  const isPro = profile?.plan === 'pro'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return (
    <div className="max-w-2xl fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      {/* Status page */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 mb-6">
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Public status page</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            A shareable page your customers can bookmark to check your service status.
            Every page links back to UptimeWatch.
          </p>
        </div>
        <SlugForm currentSlug={profile?.status_page_slug ?? null} appUrl={appUrl} />
      </section>

      {/* Billing */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Plan & billing</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {isPro
                ? 'You are on the Pro plan. Manage your subscription below.'
                : 'You are on the Free plan — up to 3 monitors, 5-minute checks.'}
            </p>
          </div>
          <span
            className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isPro
                ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
            }`}
          >
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>

        <div className="mt-5">
          {isPro ? (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                {[
                  { label: 'Monitors', value: 'Unlimited' },
                  { label: 'Check interval', value: '1 minute' },
                  { label: 'History', value: '1 year' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800"
                  >
                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">{label}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>
              {profile?.stripe_customer_id && (
                <a
                  href="/api/stripe/portal"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Manage billing, invoices & cancellation ↗
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800">
              <div className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
                <p className="font-medium text-gray-900 dark:text-white">Upgrade to Pro — $9/month</p>
                <p className="text-gray-500 dark:text-slate-400">Unlimited monitors · 1-min checks · 1-year history</p>
              </div>
              <a
                href="/api/stripe/checkout"
                className="flex-shrink-0 inline-flex items-center justify-center text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
              >
                Upgrade
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Account */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Account</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          Signed in as <span className="text-gray-700 dark:text-slate-300 font-medium">{user.email}</span>
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/privacy"
            target="_blank"
            className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 underline underline-offset-2 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            target="_blank"
            className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 underline underline-offset-2 transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-950 p-6 mt-6">
        <h2 className="font-semibold text-red-600 dark:text-red-400 mb-1">Danger zone</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  )
}
