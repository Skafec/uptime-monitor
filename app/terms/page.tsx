import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — UptimeWatch',
}

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mb-10">Last updated: May 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-slate-300">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance</h2>
            <p className="text-sm leading-relaxed">
              By creating an account or using UptimeWatch, you agree to these Terms of Service. If you do not agree, do not use the service. These terms apply to all users, including free and paid accounts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2. The service</h2>
            <p className="text-sm leading-relaxed mb-3">
              UptimeWatch is an uptime monitoring service. We periodically check the URLs you configure and notify you when they become unavailable or recover.
            </p>
            <p className="text-sm leading-relaxed">
              We do not guarantee any specific uptime SLA for the monitoring service itself. We aim for reliability but outages can and do happen. UptimeWatch is not a substitute for comprehensive infrastructure monitoring in mission-critical environments.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3. Your account</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li>You must be at least 16 years old to use the service</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>You must not share your account with others or create accounts on behalf of third parties without their consent</li>
              <li>One account per person or entity on the Free plan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4. Acceptable use</h2>
            <p className="text-sm leading-relaxed mb-3">You may not use UptimeWatch to:</p>
            <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li>Monitor URLs you do not own or have permission to monitor</li>
              <li>Generate excessive traffic to third-party servers (our monitors send one request per check interval)</li>
              <li>Circumvent or abuse the Free plan limits through multiple accounts</li>
              <li>Use the service for any unlawful purpose or in violation of any applicable law</li>
              <li>Attempt to disrupt, degrade, or gain unauthorized access to the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5. Payments and billing</h2>
            <p className="text-sm leading-relaxed mb-3">
              The Pro plan is billed monthly. Payments are processed by Stripe. By subscribing, you authorise us to charge your payment method on a recurring basis until you cancel.
            </p>
            <p className="text-sm leading-relaxed mb-3">
              You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period — you will retain Pro access until then. We do not offer refunds for partial billing periods.
            </p>
            <p className="text-sm leading-relaxed">
              We reserve the right to change pricing with 30 days notice. Price changes will not apply to your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">6. Your data</h2>
            <p className="text-sm leading-relaxed">
              You own your data. We do not claim any intellectual property rights over the URLs, names, or other content you add to the service. See our <Link href="/privacy" className="underline">Privacy Policy</Link> for details on how we handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7. Termination</h2>
            <p className="text-sm leading-relaxed mb-3">
              You may close your account at any time. We may suspend or terminate your account if you violate these terms, with or without notice depending on the severity.
            </p>
            <p className="text-sm leading-relaxed">
              On termination, your data will be deleted within 30 days. We are not liable for any loss of data following account closure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8. Disclaimer of warranties</h2>
            <p className="text-sm leading-relaxed">
              The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or that alerts will be delivered within any specific timeframe.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9. Limitation of liability</h2>
            <p className="text-sm leading-relaxed">
              To the maximum extent permitted by law, UptimeWatch shall not be liable for any indirect, incidental, special, or consequential damages, including loss of profits or revenue, arising out of or related to your use of the service — even if we have been advised of the possibility of such damages. Our total liability to you shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">10. Changes to these terms</h2>
            <p className="text-sm leading-relaxed">
              We may update these terms from time to time. We will notify you of material changes by email at least 14 days before they take effect. Continued use of the service after the effective date constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">11. Contact</h2>
            <p className="text-sm leading-relaxed">
              Questions about these terms? Email{' '}
              <a href="mailto:support@uptimewatchhq.com" className="underline">
                support@uptimewatchhq.com
              </a>
              .
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 dark:border-slate-800 mt-12 py-6 px-4">
        <div className="max-w-3xl mx-auto flex gap-4 text-sm text-gray-400 dark:text-slate-500">
          <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-slate-300 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-600 dark:hover:text-slate-300 transition-colors font-medium text-gray-600 dark:text-slate-300">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
