'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckCircle2,
  ArrowRight,
  Zap,
  Building2,
  Mail,
} from 'lucide-react'
import { AppLogo } from '@/components/app-logo'

export default function PricingPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (res.status === 401) {
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
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo />
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
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="px-6 pb-8 pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Pricing That Pays For Itself In Saved Customers
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
            One lost regular costs you $572/year. ReviewFlow Pro costs less than losing a single customer.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="px-6 pb-20 pt-8">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
          {/* Pro Plan */}
          <div className="relative flex flex-col rounded-2xl border-2 border-emerald-500 bg-white p-8 shadow-sm ring-1 ring-emerald-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                <Zap size={12} />
                14-Day Free Trial
              </span>
            </div>

            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-gray-900">ReviewFlow Pro</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">$88</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Everything you need. Up to 3 locations.</p>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {[
                'Unlimited reviews',
                'AI-generated replies',
                'Auto-polling every 15 min',
                'Custom tone & voice',
                'Email notifications',
                'Auto-publish replies',
                'Weekly summary emails',
                'Priority support',
                'Up to 3 Google Business locations',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Subscribe Now — $88/mo'}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Enterprise */}
          <div className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-bold text-gray-900">Enterprise</h3>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-500">
                For operators with 4+ locations
              </p>
            </div>

            <div className="mb-8 flex-1">
              <p className="text-sm leading-relaxed text-gray-600">
                Custom pricing, dedicated onboarding, and volume discounts for larger operations.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Everything in Pro',
                  'Unlimited locations',
                  'Dedicated onboarding',
                  'Volume discounts',
                  'Custom integrations',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="mailto:admin@carwashai.com.au?subject=ReviewFlow%20Enterprise%20Inquiry"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Mail size={16} />
              Contact Us
              <ArrowRight size={16} />
            </a>
          </div>
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
              q="What happens after the 14-day trial?"
              a="If you don't subscribe, your dashboard becomes read-only. You can still see your old reviews and replies, but AI generation, polling, and publishing are disabled. Subscribe anytime to restore full access."
            />
            <FaqItem
              q="Can I cancel anytime?"
              a="Yes. No contracts. Cancel anytime from your Settings page or billing portal."
            />
            <FaqItem
              q="What does auto-publish do?"
              a="AI-generated replies are posted to Google automatically without manual approval. You can still review them in your dashboard."
            />
            <FaqItem
              q="What if I have more than 3 locations?"
              a="Contact us for Enterprise pricing. We offer volume discounts and dedicated onboarding for larger operations."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <AppLogo size="small" />
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
