import { promises as dns } from 'dns'

const PRIVATE_IPV4_RANGES: Array<[number, number]> = [
  [0x00000000, 0xff000000], // 0.0.0.0/8
  [0x0a000000, 0xff000000], // 10.0.0.0/8
  [0x7f000000, 0xff000000], // 127.0.0.0/8
  [0xa9fe0000, 0xffff0000], // 169.254.0.0/16
  [0xac100000, 0xfff00000], // 172.16.0.0/12
  [0xc0a80000, 0xffff0000], // 192.168.0.0/16
]

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0
}

function isPrivateIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip)
  return PRIVATE_IPV4_RANGES.some(([net, mask]) => (n & mask) === net)
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/\[|\]/g, '')
  return (
    lower === '::1' ||
    lower.startsWith('fe80:') ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('::ffff:')
  )
}

export async function isPublicUrl(rawUrl: string): Promise<boolean> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  const host = parsed.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost')) return false
  try {
    const addresses = await dns.lookup(host, { all: true })
    for (const { address, family } of addresses) {
      if (family === 4 && isPrivateIpv4(address)) return false
      if (family === 6 && isPrivateIpv6(address)) return false
    }
  } catch {
    return false
  }
  return true
}

export type PingResult = {
  status: 'up' | 'down'
  statusCode: number | null
  responseTimeMs: number
  error?: string
}

export async function pingUrl(url: string, timeoutMs = 10000): Promise<PingResult> {
  if (!(await isPublicUrl(url))) {
    return { status: 'down', statusCode: null, responseTimeMs: 0, error: 'URL is not a public address' }
  }

  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'UptimeWatch/1.0 (+https://uptimewatchhq.com)',
      },
      redirect: 'follow',
    })

    clearTimeout(timeoutId)
    const responseTimeMs = Date.now() - start

    const isUp = response.status < 500

    return {
      status: isUp ? 'up' : 'down',
      statusCode: response.status,
      responseTimeMs,
    }
  } catch (error) {
    const responseTimeMs = Date.now() - start
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      status: 'down',
      statusCode: null,
      responseTimeMs,
      error: errorMessage,
    }
  }
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export function calculateUptimePercentage(
  checks: Array<{ status: 'up' | 'down' }>
): number {
  if (checks.length === 0) return 100
  const upChecks = checks.filter((c) => c.status === 'up').length
  return Math.round((upChecks / checks.length) * 10000) / 100
}

export function groupChecksByDay(
  checks: Array<{ checked_at: string; status: 'up' | 'down' }>,
  days = 90
): Array<{ date: string; uptime: number; total: number; up: number }> {
  const result: Array<{ date: string; uptime: number; total: number; up: number }> = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayChecks = checks.filter((c) => c.checked_at.startsWith(dateStr))

    const up = dayChecks.filter((c) => c.status === 'up').length
    const total = dayChecks.length
    const uptime = total === 0 ? -1 : Math.round((up / total) * 100)

    result.push({ date: dateStr, uptime, total, up })
  }

  return result
}
