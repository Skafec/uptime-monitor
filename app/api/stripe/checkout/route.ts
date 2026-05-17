import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createCheckoutSession } from '@/lib/stripe'

export async function GET() {
  return handleCheckout()
}

export async function POST() {
  return handleCheckout()
}

async function handleCheckout() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?redirectTo=/api/stripe/checkout`
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, stripe_customer_id, plan')
    .eq('id', user.id)
    .single()

  if (profile?.plan === 'pro') {
    // Already pro — redirect to billing portal
    const { createPortalSession } = await import('@/lib/stripe')
    const portal = await createPortalSession({
      customerId: profile.stripe_customer_id!,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })
    return NextResponse.redirect(portal.url)
  }

  const session = await createCheckoutSession({
    customerId: profile?.stripe_customer_id ?? undefined,
    userEmail: profile?.email ?? user.email ?? '',
    userId: user.id,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })

  return NextResponse.redirect(session.url!)
}
