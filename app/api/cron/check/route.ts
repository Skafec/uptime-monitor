import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { pingUrl, formatDuration } from '@/lib/monitor'
import { sendDownAlert, sendRecoveryAlert } from '@/lib/resend'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

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
    // Fetch all active monitors
    const { data: monitors, error: monitorsError } = await supabase
      .from('monitors')
      .select(`
        id,
        user_id,
        name,
        url,
        last_status,
        profiles!inner(email, plan)
      `)
      .eq('is_active', true)

    if (monitorsError) {
      console.error('Failed to fetch monitors:', monitorsError)
      return NextResponse.json({ error: 'Failed to fetch monitors' }, { status: 500 })
    }

    if (!monitors || monitors.length === 0) {
      return NextResponse.json({ message: 'No active monitors', ...results })
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
    last_status: string
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

    // Update monitor last status
    await supabase
      .from('monitors')
      .update({
        last_status: currentStatus,
        last_checked_at: checkedAt,
      })
      .eq('id', monitor.id)

    // Get user email (handle both array and single object from join)
    const profile = Array.isArray(monitor.profiles) ? monitor.profiles[0] : monitor.profiles
    const userEmail = profile?.email

    // Handle status changes
    if (previousStatus !== 'down' && currentStatus === 'down') {
      // Site went DOWN — create incident
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
