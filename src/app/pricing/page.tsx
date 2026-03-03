'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  MessageSquareText,
  CheckCircle2,
  X,
  ArrowRight,
  Zap,
  Building2,
} from 'lucide-react'

interface PlanCard {
  id: string
  name: string
  price: number
  description: string
  features: { text: string; included: boolean }[]
  cta: string
  popular?: boolean
}

const plans: PlanCard[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with basic review management',
    features: [
      { text: 'Up to 10 reviews/month', included: true },
      { text: 'Manual review polling', included: true },
      { text: 'Basic dashboard & activity log', included: true },
      { text: 'AI-generated replies', included: false },
      { text: 'Auto-polling every 15 min', included: false },
      { text: 'Auto-publish replies', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Get Started',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    description: 'AI-powered replies for growing businesses',
    features: [
      { text: 'Unlimited reviews', included: true },
      { text: 'AI-generated replies', included: true },
      { text: 'Auto-polling every 15 min', included: true },
      { text: 'Custom tone & instructions', included: true },
      { text: 'Activity log & analytics', included: true },
      { text: 'Auto-publish replies', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    description: 'Full automation with hands-off management',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Auto-publish replies', included: true },
      { text: 'Priority support', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Unlimited reviews', included: true },
      { text: 'AI-generated replies', included: true },
      { text: 'Custom tone & instructions', included: true },
    ],
    cta: 'Start Business Trial',
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      router.push('/signup')
      return
    }

    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      })

      const data = await res.json()

      if (res.status === 401) {
        // Not logged in — redirect to signup
        router.push('/signup')
        return
      }

      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to start checkout')
      }
    } catch {
      toast.error('Something went wrong')
    }
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <MessageSquareText className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">ReviewFlow</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="px-6 pb-8 pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose the right plan for your business
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
            Start free. Upgrade when you need AI-powered replies and automation.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="px-6 pb-20 pt-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-8 shadow-sm ${
                plan.popular
                  ? 'border-blue-600 ring-1 ring-blue-600'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    <Zap size={12} />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  {plan.id === 'business' ? (
                    <Building2 className="h-5 w-5 text-blue-600" />
                  ) : plan.id === 'pro' ? (
                    <Zap className="h-5 w-5 text-blue-600" />
                  ) : null}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {plan.name}
                  </h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500">/month</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3 text-sm">
                    {feature.included ? (
                      <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-green-500" />
                    ) : (
                      <X className="h-4.5 w-4.5 shrink-0 text-gray-300" />
                    )}
                    <span
                      className={
                        feature.included ? 'text-gray-700' : 'text-gray-400'
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {loading === plan.id ? 'Loading...' : plan.cta}
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-100 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FaqItem
              q="Can I switch plans anytime?"
              a="Yes. Upgrade or downgrade at any time from your Settings page. Changes take effect immediately, with prorated billing."
            />
            <FaqItem
              q="What happens when I hit 10 reviews on Free?"
              a="New reviews will still be detected but won't get AI replies. Upgrade to Pro for unlimited reviews and AI-powered responses."
            />
            <FaqItem
              q="Is there a contract?"
              a="No contracts. All plans are month-to-month. Cancel anytime from your billing portal."
            />
            <FaqItem
              q="What does auto-publish do?"
              a="On the Business plan, AI-generated replies are posted to Google automatically without manual approval. You can still review them in your dashboard."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-gray-900">ReviewFlow</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 ReviewFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <h3 className="font-medium text-gray-900">{q}</h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">{a}</p>
    </div>
  )
}
