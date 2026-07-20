import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://uptimewatchhq.com'),
  title: {
    default: 'UptimeWatch — Monitor your sites 24/7',
    template: '%s | UptimeWatch',
  },
  description:
    'Know when your site goes down before your customers do. Uptime monitoring with instant email alerts, public status pages, and beautiful dashboards.',
  keywords: ['uptime monitoring', 'website monitoring', 'status page', 'downtime alerts'],
  openGraph: {
    type: 'website',
    siteName: 'UptimeWatch',
    title: 'UptimeWatch — Monitor your sites 24/7',
    description:
      'Know when your site goes down before your customers do. Uptime monitoring with instant email alerts and public status pages.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UptimeWatch — Monitor your sites 24/7',
    description: 'Know when your site goes down before your customers do.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  )
}
