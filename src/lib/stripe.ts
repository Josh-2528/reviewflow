import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    })
  }
  return _stripe
}

// Re-export as `stripe` for convenience (lazy getter)
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// ── Plan definitions ─────────────────────────────────────────────────

export type PlanId = 'free' | 'pro' | 'business'

export interface PlanDefinition {
  id: PlanId
  name: string
  price: number // monthly in dollars, 0 for free
  stripePriceId: string | null // null for free tier
  reviewLimit: number | null // null = unlimited
  features: string[]
  aiReplies: boolean
  autoPolling: boolean
  autoPublish: boolean
  prioritySupport: boolean
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    stripePriceId: null,
    reviewLimit: 10,
    features: [
      'Up to 10 reviews/month',
      'Manual review polling',
      'Manual reply writing',
      'Basic dashboard',
    ],
    aiReplies: false,
    autoPolling: false,
    autoPublish: false,
    prioritySupport: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
    reviewLimit: null,
    features: [
      'Unlimited reviews',
      'AI-generated replies',
      'Auto-polling every 15 min',
      'Custom tone & instructions',
      'Activity log & analytics',
    ],
    aiReplies: true,
    autoPolling: true,
    autoPublish: false,
    prioritySupport: false,
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 99,
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || '',
    reviewLimit: null,
    features: [
      'Everything in Pro',
      'Auto-publish replies',
      'Priority support',
      'Dedicated account manager',
    ],
    aiReplies: true,
    autoPolling: true,
    autoPublish: true,
    prioritySupport: true,
  },
}

// ── Helpers ──────────────────────────────────────────────────────────

export function getPlanById(planId: string | null): PlanDefinition {
  if (planId && planId in PLANS) {
    return PLANS[planId as PlanId]
  }
  return PLANS.free
}

export function getPlanByPriceId(priceId: string): PlanDefinition | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceId && plan.stripePriceId === priceId) {
      return plan
    }
  }
  return null
}

/**
 * Check if a user has reached their review limit for the current month.
 * Returns true if they can still receive reviews.
 */
export async function canReceiveReviews(
  userId: string,
  supabase: { from: (table: string) => unknown },
  plan: PlanDefinition
): Promise<boolean> {
  if (plan.reviewLimit === null) return true

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth)

  return (count || 0) < plan.reviewLimit
}
