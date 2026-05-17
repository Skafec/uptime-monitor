import { NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { createServiceSupabaseClient } from '@/lib/supabase'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

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

        // Downgrade user back to free
        await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('stripe_customer_id', customerId)

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
          await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('stripe_customer_id', customerId)
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
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
