import type { MetadataRoute } from 'next'

const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://uptimewatchhq.com').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Authed app and API routes shouldn't be crawled. Public status pages
      // (/status/*) stay crawlable — they're the organic-backlink surface.
      disallow: ['/dashboard', '/settings', '/monitors', '/api'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
