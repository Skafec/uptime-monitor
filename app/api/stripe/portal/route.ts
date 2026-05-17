import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createPortalSession } from '@/lib/stripe'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, plan')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`)
  }

  const portal = await createPortalSession({
    customerId: profile.stripe_customer_id,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  })

  return NextResponse.redirect(portal.url)
}
