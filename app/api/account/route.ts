import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase'
import { deleteCustomer } from '@/lib/stripe'

export const runtime = 'nodejs'

// Permanently delete the signed-in user's account and all their data.
export async function DELETE() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceSupabaseClient()

  const { data: profile } = await service
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  // Cancel billing first. Deleting the Stripe customer cancels any active
  // subscription. This must succeed before we remove the account — otherwise a
  // Pro user could be deleted while still being charged, with no way to manage
  // it. A customer that's already gone in Stripe counts as success.
  if (profile?.stripe_customer_id) {
    try {
      await deleteCustomer(profile.stripe_customer_id)
    } catch (err) {
      const code = (err as { code?: string })?.code
      if (code !== 'resource_missing') {
        console.error(`Failed to cancel billing for ${user.id}:`, err)
        return NextResponse.json(
          { error: 'Could not cancel your subscription. Please try again or contact support.' },
          { status: 502 }
        )
      }
    }
  }

  // Delete the profile row. FK cascades remove the user's monitors, and in turn
  // their monitor_checks and incidents.
  const { error: profileError } = await service.from('profiles').delete().eq('id', user.id)
  if (profileError) {
    console.error(`Failed to delete profile for ${user.id}:`, profileError)
    return NextResponse.json({ error: 'Failed to delete account data' }, { status: 500 })
  }

  // Remove the auth user (must come after the profile row, which references it).
  const { error: authError } = await service.auth.admin.deleteUser(user.id)
  if (authError) {
    console.error(`Failed to delete auth user ${user.id}:`, authError)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  // Clear the session cookie server-side; the client also redirects away.
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
