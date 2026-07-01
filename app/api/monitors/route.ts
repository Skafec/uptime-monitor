import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { isPublicUrl } from '@/lib/monitor'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: monitors, error } = await supabase
    .from('monitors')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(monitors)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, url } = body

  if (!name || !url) {
    return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 })
  }

  // Validate URL format and SSRF safety
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  if (!(await isPublicUrl(url))) {
    return NextResponse.json(
      { error: 'URL must be a public http(s) address' },
      { status: 400 }
    )
  }

  // Load plan once — drives both interval gating and the monitor-count limit.
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  // Server-side interval gating. Default to 5 minutes; only Pro may pick 1.
  // Any other value is rejected rather than silently clamped.
  let interval_minutes = 5
  if ('interval_minutes' in body) {
    if (![1, 5].includes(body.interval_minutes)) {
      return NextResponse.json(
        { error: 'interval_minutes must be 1 or 5' },
        { status: 400 }
      )
    }
    if (body.interval_minutes === 1 && profile?.plan !== 'pro') {
      return NextResponse.json(
        { error: '1-minute checks require the Pro plan' },
        { status: 403 }
      )
    }
    interval_minutes = body.interval_minutes
  }

  if (profile?.plan === 'free') {
    const { count } = await supabase
      .from('monitors')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Free plan limit reached. Upgrade to Pro for unlimited monitors.' },
        { status: 403 }
      )
    }
  }

  const { data: monitor, error } = await supabase
    .from('monitors')
    .insert({
      user_id: user.id,
      name,
      url,
      interval_minutes,
      last_status: 'unknown',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(monitor, { status: 201 })
}
