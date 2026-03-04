import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, PLANS, type PlanId } from '@/lib/stripe'

// POST /api/stripe/checkout — create a Stripe Checkout session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan_id } = await request.json()

    if (!plan_id || !['pro'].includes(plan_id)) {
      return NextResponse.json(
        { error: 'Invalid plan.' },
        { status: 400 }
      )
    }

    const plan = PLANS[plan_id as PlanId]
    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: 'This plan does not require payment.' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get or create Stripe customer
    const { data: profile } = await adminClient
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email!,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await adminClient
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create Checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?checkout=success&plan=${plan_id}`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_id: plan_id,
        },
      },
      metadata: {
        supabase_user_id: user.id,
        plan_id: plan_id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
