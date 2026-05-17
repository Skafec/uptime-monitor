import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const RESERVED = [
  'dashboard', 'status', 'api', 'login', 'signup', 'privacy',
  'terms', 'admin', 'settings', 'checkout', 'webhook', 'app',
  'www', 'mail', 'support', 'help', 'about', 'blog',
]

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { slug } = body

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }

  const normalised = slug.toLowerCase().trim()

  if (!/^[a-z0-9-]{3,30}$/.test(normalised)) {
    return NextResponse.json(
      { error: 'Slug must be 3–30 characters: lowercase letters, numbers and hyphens only' },
      { status: 400 }
    )
  }

  if (RESERVED.includes(normalised)) {
    return NextResponse.json({ error: 'That slug is reserved. Please choose another.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ status_page_slug: normalised })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That slug is already taken.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ slug: normalised })
}
