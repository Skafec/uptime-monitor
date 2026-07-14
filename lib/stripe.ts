import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
  })
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})

export async function createCheckoutSession(params: {
  customerId?: string
  userEmail: string
  userId: string
  successUrl: string
  cancelUrl: string
}) {
  const { customerId, userEmail, userId, successUrl, cancelUrl } = params
  const stripeClient = getStripe()

  const session = await stripeClient.checkout.sessions.create({
    customer: customerId || undefined,
    customer_email: customerId ? undefined : userEmail,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
    allow_promotion_codes: true,
  })

  return session
}

export async function createPortalSession(params: {
  customerId: string
  returnUrl: string
}) {
  const { customerId, returnUrl } = params
  const stripeClient = getStripe()

  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

// Used on account deletion. Deleting the customer cancels any active
// subscription and removes their payment data from Stripe.
export async function deleteCustomer(customerId: string) {
  const stripeClient = getStripe()
  return stripeClient.customers.del(customerId)
}

export function constructWebhookEvent(
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  const stripeClient = getStripe()
  return stripeClient.webhooks.constructEvent(body, signature, secret)
}
