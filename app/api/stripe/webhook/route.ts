import { NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { createServiceSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

const FREE_MONITOR_LIMIT = 3

// Downgrade a customer to Free and enforce the plan on their existing data:
// revoke the Pro-only 1-minute interval, and pause monitors beyond the free
// limit (keeping the oldest ones active) so a downgraded user doesn't keep
// Pro benefits. Data is preserved — paused monitors can be reactivated.
async function downgradeToFree(supabase: SupabaseClient<Database>, customerId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .update({ plan: 'free' })
    .eq('stripe_customer_id', customerId)
    .select('id')
    .single()

  if (!profile) return

  await supabase
    .from('monitors')
    .update({ interval_minutes: 5 })
    .eq('user_id', profile.id)

  const { data: monitors } = await supabase
    .from('monitors')
    .select('id')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: true })

  if (monitors && monitors.length > FREE_MONITOR_LIMIT) {
    const excessIds = monitors.slice(FREE_MONITOR_LIMIT).map((m) => m.id)
    await supabase.from('monitors').update({ is_active: false }).in('id', excessIds)
  }
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  const supabase = createServiceSupabaseClient()

  // Idempotency guard. Record the event id before doing any work; an
  // ON CONFLICT DO NOTHING insert (ignoreDuplicates) returns no rows when the
  // event was already processed — including when two retries race here, since
  // only one insert wins. In that case skip the switch entirely so side effects
  // (plan changes, slug creation) run exactly once.
  const { data: recorded, error: dedupeError } = await supabase
    .from('stripe_events')
    .upsert({ id: event.id }, { onConflict: 'id', ignoreDuplicates: true })
    .select('id')

  if (dedupeError) {
    console.error('Failed to record Stripe event:', dedupeError.message)
    return NextResponse.json({ error: 'Idempotency check failed' }, { status: 500 })
  }

  if (!recorded || recorded.length === 0) {
    console.log(`Duplicate Stripe event ${event.id} ignored`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (!userId) {
          console.error('No userId in checkout session metadata')
          break
        }

        // Update user to pro
        await supabase
          .from('profiles')
          .update({
            plan: 'pro',
            stripe_customer_id: session.customer as string,
          })
          .eq('id', userId)

        // Set up default status page slug if not set
        const { data: profile } = await supabase
          .from('profiles')
          .select('status_page_slug, email')
          .eq('id', userId)
          .single()

        if (!profile?.status_page_slug && profile?.email) {
          const baseSlug = profile.email
            .split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')

          // Check if slug is taken
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('status_page_slug', baseSlug)
            .neq('id', userId)
            .single()

          const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug

          await supabase
            .from('profiles')
            .update({ status_page_slug: slug })
            .eq('id', userId)
        }

        console.log(`User ${userId} upgraded to Pro`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Downgrade user back to free + enforce free-plan limits
        await downgradeToFree(supabase, customerId)

        console.log(`Customer ${customerId} downgraded to Free (subscription cancelled)`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Handle subscription status changes
        if (subscription.status === 'active') {
          await supabase
            .from('profiles')
            .update({ plan: 'pro' })
            .eq('stripe_customer_id', customerId)
        } else if (
          subscription.status === 'canceled' ||
          subscription.status === 'unpaid' ||
          subscription.status === 'past_due'
        ) {
          await downgradeToFree(supabase, customerId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.warn(`Payment failed for customer ${invoice.customer}`)
        // Could send an email here to warn the user
        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (error) {
    console.error(`Error handling event ${event.type}:`, error)
    // Release the idempotency record so Stripe's retry reprocesses this event
    // rather than being swallowed as a duplicate after a partial failure.
    await supabase.from('stripe_events').delete().eq('id', event.id)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
