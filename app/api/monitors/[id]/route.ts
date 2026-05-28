import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { isPublicUrl } from '@/lib/monitor'

type MonitorUpdate = Database['public']['Tables']['monitors']['Update']

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: monitor, error } = await supabase
    .from('monitors')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !monitor) {
    return NextResponse.json({ error: 'Monitor not found' }, { status: 404 })
  }

  return NextResponse.json(monitor)
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const updateData: MonitorUpdate = {}

  if ('name' in body) updateData.name = body.name
  if ('url' in body) {
    if (!(await isPublicUrl(body.url))) {
      return NextResponse.json(
        { error: 'URL must be a public http(s) address' },
        { status: 400 }
      )
    }
    updateData.url = body.url
  }
  if ('is_active' in body) updateData.is_active = body.is_active
  if ('interval_minutes' in body) updateData.interval_minutes = body.interval_minutes

  const { data: monitor, error } = await supabase
    .from('monitors')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !monitor) {
    return NextResponse.json({ error: 'Monitor not found or update failed' }, { status: 404 })
  }

  return NextResponse.json(monitor)
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('monitors')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
