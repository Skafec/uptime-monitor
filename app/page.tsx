import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full pulse-dot" />
            </div>
            <span className="font-semibold text-lg text-gray-900 dark:text-white">UptimeWatch</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 sm:py-32 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-full px-4 py-1.5 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full pulse-dot" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Free plan — no credit card required</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Know when your site goes down{' '}
              <span className="text-green-500">before your customers do</span>
            </h1>

            <p className="text-xl text-gray-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
              UptimeWatch monitors your websites every 5 minutes and sends instant email alerts when something breaks.
              Free status pages included.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium px-8 py-3.5 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors text-base"
              >
                Start monitoring for free
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 text-gray-600 dark:text-slate-300 font-medium px-8 py-3.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-base"
              >
                See pricing
              </a>
            </div>

            <p className="mt-5 text-sm text-gray-400 dark:text-slate-500">
              3 monitors free. No credit card required.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 sm:px-6 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Everything you need to stay online</h2>
              <p className="text-lg text-gray-500 dark:text-slate-400">Simple, reliable monitoring without the enterprise price tag.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '⚡',
                  title: '5-minute checks',
                  description: 'Your monitors ping every 5 minutes. Upgrade to Pro for 1-minute checks. Never miss an outage.',
                },
                {
                  icon: '📧',
                  title: 'Instant email alerts',
                  description: 'Get notified the moment your site goes down, and again when it recovers. Powered by Resend.',
                },
                {
                  icon: '🌐',
                  title: 'Public status pages',
                  description: 'Share your uptime status with customers. A beautiful page at /status/your-brand — no login needed.',
                },
                {
                  icon: '📊',
                  title: '90-day history',
                  description: 'Visual uptime bars showing the last 90 days at a glance. See response times and incident history.',
                },
                {
                  icon: '🔒',
                  title: 'Secure by default',
                  description: 'Your monitors and data are protected with Supabase Row Level Security. We never share your data.',
                },
                {
                  icon: '💳',
                  title: 'Simple pricing',
                  description: 'Free plan for individuals. One flat rate for Pro. No hidden fees, no per-seat pricing.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-gray-200 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="text-2xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Simple, transparent pricing</h2>
              <p className="text-lg text-gray-500 dark:text-slate-400">Start free, upgrade when you need more.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Free */}
              <div className="p-8 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                <div className="mb-6">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">Free</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
                    <span className="text-gray-500 dark:text-slate-400 mb-1">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Perfect for personal projects and small sites.</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    '3 monitors',
                    '5-minute check interval',
                    '90-day history',
                    'Email alerts',
                    'Public status page',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block text-center py-3 px-6 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Get started free
                </Link>
              </div>

              {/* Pro */}
              <div className="p-8 rounded-2xl border-2 border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">MOST POPULAR</span>
                </div>
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-1">Pro</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">$9</span>
                    <span className="opacity-60 mb-1">/month</span>
                  </div>
                  <p className="text-sm opacity-60 mt-2">For professionals and growing teams.</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'Unlimited monitors',
                    '1-minute check interval',
                    '1-year history',
                    'Email alerts',
                    'Custom status page slug',
                    'Priority support',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm opacity-90">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup?plan=pro"
                  className="block text-center py-3 px-6 rounded-xl bg-green-500 hover:bg-green-400 text-white font-medium transition-colors"
                >
                  Start Pro trial
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Your next downtime is coming. Be ready.
            </h2>
            <p className="text-lg text-gray-500 dark:text-slate-400 mb-8">
              Join thousands of developers who trust UptimeWatch to keep their sites running.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium px-8 py-3.5 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors text-base"
            >
              Start monitoring for free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 dark:border-slate-800 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            <span className="font-medium text-gray-700 dark:text-slate-300">UptimeWatch</span>
          </div>
          <p className="text-sm text-gray-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} UptimeWatch. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-gray-400 dark:text-slate-500">
            <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 dark:hover:text-slate-300 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
