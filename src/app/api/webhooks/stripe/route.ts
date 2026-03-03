import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPlanByPriceId } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export const runtime = 'nodejs'

// Helper to safely extract current_period_end from a subscription object
// Stripe SDK v20+ changed the shape; we handle both old and new formats
function getSubscriptionPeriodEnd(sub: Record<string, unknown>): string | null {
  const periodEnd =
    (sub as Record<string, unknown>).current_period_end ??
    ((sub as Record<string, unknown>).currentPeriodEnd as number | undefined)
  if (typeof periodEnd === 'number') {
    return new Date(periodEnd * 1000).toISOString()
  }
  return null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  try {
    switch (event.type) {
      // ── Checkout completed ─────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const userId = session.metadata?.supabase_user_id
        const planId = session.metadata?.plan_id

        if (!userId || !planId) {
          console.error('Webhook: Missing metadata on checkout session')
          break
        }

        if (session.subscription) {
          const subResponse = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sub = subResponse as any

          await adminClient
            .from('users')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: sub.id,
              plan_id: planId,
              subscription_status: sub.status,
              subscription_current_period_end: getSubscriptionPeriodEnd(sub),
            })
            .eq('id', userId)

          console.log(`Webhook: User ${userId} subscribed to ${planId}`)
        }
        break
      }

      // ── Subscription updated (upgrade/downgrade/renewal) ───────
      case 'customer.subscription.updated': {
        // Event data comes directly from Stripe — use raw object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any

        const userId = subscription.metadata?.supabase_user_id
        if (!userId) {
          const { data: user } = await adminClient
            .from('users')
            .select('id')
            .eq('stripe_customer_id', subscription.customer as string)
            .single()

          if (!user) {
            console.error('Webhook: Could not find user for subscription', subscription.id)
            break
          }

          await updateSubscription(adminClient, user.id, subscription)
        } else {
          await updateSubscription(adminClient, userId, subscription)
        }
        break
      }

      // ── Subscription deleted (cancelled) ───────────────────────
      case 'customer.subscription.deleted': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any

        const { data: user } = await adminClient
          .from('users')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (user) {
          await adminClient
            .from('users')
            .update({
              plan_id: 'free',
              subscription_status: 'canceled',
              stripe_subscription_id: null,
              subscription_current_period_end: null,
            })
            .eq('id', user.id)

          console.log(`Webhook: User ${user.id} subscription cancelled → free plan`)
        }
        break
      }

      // ── Invoice payment failed ─────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        const { data: user } = await adminClient
          .from('users')
          .select('id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (user) {
          await adminClient
            .from('users')
            .update({ subscription_status: 'past_due' })
            .eq('id', user.id)

          console.log(`Webhook: User ${user.id} payment failed → past_due`)
        }
        break
      }

      default:
        break
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}

// ── Helper ───────────────────────────────────────────────────────────

async function updateSubscription(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscription: any
) {
  const priceId = subscription.items?.data?.[0]?.price?.id
  let planId = subscription.metadata?.plan_id || 'pro'

  if (priceId) {
    const matchedPlan = getPlanByPriceId(priceId)
    if (matchedPlan) {
      planId = matchedPlan.id
    }
  }

  await adminClient
    .from('users')
    .update({
      stripe_subscription_id: subscription.id,
      plan_id: planId,
      subscription_status: subscription.status,
      subscription_current_period_end: getSubscriptionPeriodEnd(subscription),
    })
    .eq('id', userId)

  console.log(`Webhook: User ${userId} subscription updated → ${planId} (${subscription.status})`)
}
