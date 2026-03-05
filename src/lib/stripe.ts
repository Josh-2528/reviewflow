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

export type PlanStatus = 'trial' | 'pro' | 'expired'

export const TRIAL_DURATION_DAYS = 14

export interface PlanDefinition {
  name: string
  price: number
  stripePriceId: string
  features: string[]
}

export const PRO_PLAN: PlanDefinition = {
  name: 'ReviewFlow Pro',
  price: 88,
  stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
  features: [
    'Unlimited reviews',
    'AI-generated replies',
    'Auto-polling every 15 min',
    'Custom tone & voice',
    'Email notifications',
    'Auto-publish replies',
    'Weekly summary emails',
    'Priority support',
    'Up to 3 Google Business locations',
  ],
}

// ── Trial helpers ────────────────────────────────────────────────────

/**
 * Calculate the user's current plan status based on their subscription and trial.
 */
export function getUserPlanStatus(user: {
  plan_id: string | null
  subscription_status: string | null
  trial_started_at: string | null
}): PlanStatus {
  // If they have an active subscription, they're pro
  if (
    user.plan_id === 'pro' &&
    (user.subscription_status === 'active' || user.subscription_status === 'trialing')
  ) {
    return 'pro'
  }

  // If they have a trial start date, check if it's still within 14 days
  if (user.trial_started_at) {
    const trialStart = new Date(user.trial_started_at)
    const now = new Date()
    const daysSinceStart = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceStart <= TRIAL_DURATION_DAYS) {
      return 'trial'
    }
  }

  // No active sub and trial expired (or never started)
  return 'expired'
}

/**
 * Get the number of trial days remaining. Returns 0 if expired.
 * Remaining = 14 - floor(days elapsed). Day 0 = 14 remaining, day 1 = 13, etc.
 */
export function getTrialDaysRemaining(trialStartedAt: string | null): number {
  if (!trialStartedAt) return 0

  const trialStart = new Date(trialStartedAt)
  const now = new Date()
  const fullDaysElapsed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24))
  const remaining = TRIAL_DURATION_DAYS - fullDaysElapsed

  return Math.max(0, remaining)
}

/**
 * Check if a user has full access (trial or pro).
 * Users with expired trials or no subscription get read-only.
 */
export function hasFullAccess(user: {
  plan_id: string | null
  subscription_status: string | null
  trial_started_at: string | null
}): boolean {
  const status = getUserPlanStatus(user)
  return status === 'trial' || status === 'pro'
}

/**
 * Check if auto-polling should be enabled for this user.
 * Only active trial and pro users get auto-polling.
 */
export function canAutoPoll(user: {
  plan_id: string | null
  subscription_status: string | null
  trial_started_at: string | null
}): boolean {
  return hasFullAccess(user)
}

/**
 * Check if AI replies should be generated for this user.
 */
export function canGenerateAIReplies(user: {
  plan_id: string | null
  subscription_status: string | null
  trial_started_at: string | null
}): boolean {
  return hasFullAccess(user)
}

/**
 * Check if auto-publish is available for this user.
 */
export function canAutoPublish(user: {
  plan_id: string | null
  subscription_status: string | null
  trial_started_at: string | null
}): boolean {
  return hasFullAccess(user)
}

/**
 * Get plan by price ID (for webhook handling).
 */
export function getPlanByPriceId(priceId: string): { id: string; name: string } | null {
  if (PRO_PLAN.stripePriceId && PRO_PLAN.stripePriceId === priceId) {
    return { id: 'pro', name: PRO_PLAN.name }
  }
  return null
}
