import Link from 'next/link'
import type { Metadata } from 'next'
import CheckForm from '@/components/CheckForm'

export const metadata: Metadata = {
  title: 'Is your site down? Free website status checker',
  description:
    'Check if a website is up or down right now. Free instant status checker — enter a URL to see if it’s reachable, its HTTP status code, and response time.',
  alternates: { canonical: '/check' },
}

export default function CheckPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <header className="border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
            <span className="font-semibold text-lg text-gray-900 dark:text-white">UptimeWatch</span>
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Start monitoring free
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center">
          Is your site down?
        </h1>
        <p className="mt-3 text-center text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
          Enter a URL to check if it’s up or down right now — you’ll see whether it’s reachable, its
          HTTP status code, and how fast it responded.
        </p>

        <div className="mt-8">
          <CheckForm />
        </div>

        <section className="mt-16 prose prose-gray dark:prose-invert max-w-none text-sm text-gray-600 dark:text-slate-300 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">How the check works</h2>
          <p>
            We send a request to the URL from our servers and report back whether it responded. A
            site is considered <strong>up</strong> when it returns an HTTP status below 500, and{' '}
            <strong>down</strong> when it times out, refuses the connection, or returns a server
            error (5xx).
          </p>
          <p>
            A one-off check only tells you what’s happening this second. If a site matters to you,
            you want to know the <em>moment</em> it goes down — not when a customer emails you.{' '}
            <Link href="/signup" className="underline">
              Create a free UptimeWatch account
            </Link>{' '}
            to monitor any URL around the clock and get an instant email alert on downtime and
            recovery, plus a public status page.
          </p>
        </section>
      </main>
    </div>
  )
}
