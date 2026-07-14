import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { pingUrl, formatDuration } from '@/lib/monitor'
import { sendDownAlert, sendRecoveryAlert } from '@/lib/resend'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

// Flap protection: require this many consecutive failing checks before we
// declare an outage (open an incident + email the customer). Prevents a single
// blip — a DNS hiccup or brief CDN error — from firing a false alert.
const FAILURE_THRESHOLD = 2

export async function GET(request: Request) {
  // Validate cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceSupabaseClient()
  const startTime = Date.now()
  const results = {
    checked: 0,
    down: 0,
    up: 0,
    errors: 0,
    alertsSent: 0,
  }

  try {
    // Fetch active monitors that are due now. next_check_at is pushed forward
    // by interval_minutes after each check, so with a 1-minute cron cadence
    // free monitors (5) are skipped 4 of 5 runs while Pro monitors (1) run
    // every time — that's what makes the paid 1-minute interval real.
    const { data: monitors, error: monitorsError } = await supabase
      .from('monitors')
      .select(`
        id,
        user_id,
        name,
        url,
        last_status,
        consecutive_failures,
        interval_minutes,
        profiles!inner(email, plan)
      `)
      .eq('is_active', true)
      .lte('next_check_at', new Date().toISOString())

    if (monitorsError) {
      console.error('Failed to fetch monitors:', monitorsError)
      return NextResponse.json({ error: 'Failed to fetch monitors' }, { status: 500 })
    }

    if (!monitors || monitors.length === 0) {
      return NextResponse.json({ message: 'No monitors due', ...results })
    }

    // Process monitors in parallel (batch of 10 to avoid hitting limits)
    const batchSize = 10
    for (let i = 0; i < monitors.length; i += batchSize) {
      const batch = monitors.slice(i, i + batchSize)
      await Promise.all(batch.map((monitor) => processMonitor(monitor, supabase, results)))
    }

    const duration = Date.now() - startTime
    console.log(`Cron completed in ${duration}ms`, results)

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      ...results,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Also support POST from Vercel Cron
export const POST = GET

async function processMonitor(
  monitor: {
    id: string
    user_id: string
    name: string
    url: string
    last_status: 'up' | 'down' | 'unknown'
    consecutive_failures: number
    interval_minutes: number
    profiles: { email: string; plan: string } | { email: string; plan: string }[]
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  results: { checked: number; down: number; up: number; errors: number; alertsSent: number }
) {
  try {
    const pingResult = await pingUrl(monitor.url, 10000)
    const checkedAt = new Date().toISOString()
    const currentStatus = pingResult.status
    const previousStatus = monitor.last_status

    results.checked++
    if (currentStatus === 'up') {
      results.up++
    } else {
      results.down++
    }

    // Save check result
    await supabase.from('monitor_checks').insert({
      monitor_id: monitor.id,
      status: currentStatus,
      response_time_ms: pingResult.responseTimeMs,
      status_code: pingResult.statusCode,
      checked_at: checkedAt,
    })

    // Flap protection. Count consecutive failures; only once we cross
    // FAILURE_THRESHOLD does the *declared* status flip to 'down'. A success
    // resets the counter and clears the declared status. Sub-threshold failures
    // are still recorded in monitor_checks above, but don't alert.
    const previousFailures = monitor.consecutive_failures ?? 0
    const consecutiveFailures = currentStatus === 'down' ? previousFailures + 1 : 0

    let declaredStatus: 'up' | 'down' | 'unknown' = previousStatus
    if (currentStatus === 'up') {
      declaredStatus = 'up'
    } else if (consecutiveFailures >= FAILURE_THRESHOLD) {
      declaredStatus = 'down'
    }

    // Reschedule the next check by the monitor's interval (5 for free, 1 for
    // Pro). Guards against a bad/zero interval by falling back to 5.
    const intervalMinutes = monitor.interval_minutes > 0 ? monitor.interval_minutes : 5
    const nextCheckAt = new Date(Date.now() + intervalMinutes * 60_000).toISOString()

    // Update monitor declared status + failure counter + next due time
    await supabase
      .from('monitors')
      .update({
        last_status: declaredStatus,
        last_checked_at: checkedAt,
        consecutive_failures: consecutiveFailures,
        next_check_at: nextCheckAt,
      })
      .eq('id', monitor.id)

    // Get user email (handle both array and single object from join)
    const profile = Array.isArray(monitor.profiles) ? monitor.profiles[0] : monitor.profiles
    const userEmail = profile?.email

    // Handle status changes (based on the declared status, not the raw ping)
    if (declaredStatus === 'down' && previousStatus !== 'down') {
      // Threshold crossed — declare the outage: create incident
      await supabase.from('incidents').insert({
        monitor_id: monitor.id,
        started_at: checkedAt,
        is_resolved: false,
      })

      // Send down alert
      if (userEmail) {
        try {
          await sendDownAlert({
            to: userEmail,
            monitorName: monitor.name,
            url: monitor.url,
            statusCode: pingResult.statusCode ?? undefined,
            checkedAt,
          })
          results.alertsSent++
        } catch (emailError) {
          console.error(`Failed to send down alert for ${monitor.id}:`, emailError)
        }
      }
    } else if (previousStatus === 'down' && currentStatus === 'up') {
      // Site came BACK UP — resolve incident
      const { data: openIncident } = await supabase
        .from('incidents')
        .select('id, started_at')
        .eq('monitor_id', monitor.id)
        .eq('is_resolved', false)
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (openIncident) {
        await supabase
          .from('incidents')
          .update({
            is_resolved: true,
            resolved_at: checkedAt,
          })
          .eq('id', openIncident.id)

        // Calculate downtime duration
        const downtimeMs =
          new Date(checkedAt).getTime() - new Date(openIncident.started_at).getTime()
        const downtimeDuration = formatDuration(downtimeMs)

        // Send recovery alert
        if (userEmail) {
          try {
            await sendRecoveryAlert({
              to: userEmail,
              monitorName: monitor.name,
              url: monitor.url,
              downtimeDuration,
              checkedAt,
            })
            results.alertsSent++
          } catch (emailError) {
            console.error(`Failed to send recovery alert for ${monitor.id}:`, emailError)
          }
        }
      }
    }
  } catch (error) {
    results.errors++
    console.error(`Error processing monitor ${monitor.id}:`, error)
  }
}
