import { NextResponse } from 'next/server'
import { pingUrl, isPublicUrl } from '@/lib/monitor'

export const runtime = 'nodejs'

// Public, no-auth one-shot checker behind the /check tool. SSRF is guarded by
// isPublicUrl (private/reserved IPs and non-http(s) schemes are rejected).
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const raw = typeof body?.url === 'string' ? body.url.trim() : ''

  if (!raw) {
    return NextResponse.json({ error: 'Please enter a URL to check.' }, { status: 400 })
  }

  let url = raw
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`
  }

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'That doesn’t look like a valid URL.' }, { status: 400 })
  }

  if (!(await isPublicUrl(url))) {
    return NextResponse.json(
      { error: 'URL must be a public http(s) address.' },
      { status: 400 }
    )
  }

  const result = await pingUrl(url, 10000)
  return NextResponse.json({
    url,
    status: result.status,
    statusCode: result.statusCode,
    responseTimeMs: result.responseTimeMs,
  })
}
