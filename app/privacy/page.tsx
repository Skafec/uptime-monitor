import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — UptimeWatch',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-500 rounded-md flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-full" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">UptimeWatch</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mb-10">Last updated: May 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-slate-300">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">1. Information we collect</h2>
            <p className="text-sm leading-relaxed mb-3">
              When you create an account, we collect your email address and a password (stored as a secure hash — we never see your plaintext password). We do not collect your name, address, or any other personal information unless you choose to provide it.
            </p>
            <p className="text-sm leading-relaxed">
              When you use the service, we store the URLs you add as monitors, the results of each uptime check (HTTP status code, response time, timestamp), and incident records when your sites go down. This data belongs to you and is used solely to provide the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2. How we use your information</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li>To operate the monitoring service and send you uptime alerts</li>
              <li>To manage your subscription and process payments</li>
              <li>To display your public status page (if you set one up)</li>
              <li>To send transactional emails (down alerts, recovery alerts, billing receipts)</li>
              <li>We do not sell your data, use it for advertising, or share it with third parties except as described in Section 3</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3. Third-party services</h2>
            <p className="text-sm leading-relaxed mb-3">
              We use the following third-party services to operate UptimeWatch:
            </p>
            <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li><strong>Supabase</strong> — stores your account data and monitor history. Data is hosted on AWS. <a href="https://supabase.com/privacy" className="underline" target="_blank" rel="noopener">Privacy policy</a></li>
              <li><strong>Stripe</strong> — processes payments. We never see or store your card details. <a href="https://stripe.com/privacy" className="underline" target="_blank" rel="noopener">Privacy policy</a></li>
              <li><strong>Resend</strong> — delivers email alerts. Your email address is shared with Resend solely to send you messages. <a href="https://resend.com/legal/privacy-policy" className="underline" target="_blank" rel="noopener">Privacy policy</a></li>
              <li><strong>Vercel</strong> — hosts the application. May process request logs including IP addresses. <a href="https://vercel.com/legal/privacy-policy" className="underline" target="_blank" rel="noopener">Privacy policy</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4. Data retention</h2>
            <p className="text-sm leading-relaxed">
              Monitor check history is retained for 90 days on the Free plan and 1 year on the Pro plan. If you delete a monitor, its history is permanently deleted. If you close your account, all of your data is deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5. Cookies</h2>
            <p className="text-sm leading-relaxed">
              We use a single session cookie to keep you logged in. We do not use tracking cookies, analytics cookies, or any third-party cookie-based advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">6. Your rights</h2>
            <p className="text-sm leading-relaxed mb-3">
              You may request a copy of all data we hold about you, ask us to correct inaccurate data, or ask us to delete your account and all associated data. To do any of these, email us at the address below.
            </p>
            <p className="text-sm leading-relaxed">
              If you are located in the EU or UK, you have additional rights under GDPR/UK GDPR, including the right to data portability and the right to object to processing. You also have the right to lodge a complaint with your local supervisory authority.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7. Changes to this policy</h2>
            <p className="text-sm leading-relaxed">
              We may update this policy from time to time. We will notify you of material changes by email. Continued use of the service after the effective date constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8. Contact</h2>
            <p className="text-sm leading-relaxed">
              Questions about this policy? Email us at{' '}
              <a href="mailto:privacy@uptimewatch.io" className="underline">
                privacy@uptimewatch.io
              </a>
              .
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 dark:border-slate-800 mt-12 py-6 px-4">
        <div className="max-w-3xl mx-auto flex gap-4 text-sm text-gray-400 dark:text-slate-500">
          <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-slate-300 transition-colors font-medium text-gray-600 dark:text-slate-300">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-600 dark:hover:text-slate-300 transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
