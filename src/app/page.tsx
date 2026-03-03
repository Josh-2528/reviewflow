import Link from 'next/link'
import {
  MessageSquareText,
  Sparkles,
  Send,
  Star,
  ArrowRight,
  CheckCircle2,
  Play,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">ReviewFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Pricing
            </Link>
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
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pb-20 pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            AI-Powered Review Management{' '}
            <span className="text-blue-600">for Your Business</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Never miss a review. Auto-generate perfect replies. Save hours every
            week.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
            >
              Start Free Trial
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/demo"
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Play size={18} />
              Try Demo
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No credit card required · 14-day free trial
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Everything you need to manage reviews
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-blue-600" />}
              title="Automatic Review Detection"
              description="We monitor your Google Business Profile around the clock. New reviews are detected within minutes — you'll never miss one."
            />
            <FeatureCard
              icon={<MessageSquareText className="h-8 w-8 text-blue-600" />}
              title="AI-Generated Replies"
              description="Every review gets a smart, human-sounding reply drafted by AI. Personalized to your business tone and the specific review."
            />
            <FeatureCard
              icon={<Send className="h-8 w-8 text-blue-600" />}
              title="One-Click Publishing"
              description="Approve the draft and it's posted to Google instantly. Or enable auto-publish and let ReviewFlow handle everything."
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="mt-4 text-xl font-medium text-gray-900">
            &ldquo;ReviewFlow cut our review response time from 2 days to 2
            minutes. Game changer.&rdquo;
          </p>
          <p className="mt-2 text-sm text-gray-500">
            — Sarah K., Café Owner
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
            Simple, transparent pricing
          </h2>
          <p className="mb-12 text-center text-gray-600">
            Start free. Upgrade when you&apos;re ready for AI-powered automation.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Free</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Up to 10 reviews/month</p>
              <ul className="mt-6 space-y-2">
                {['Manual review polling', 'Basic dashboard', 'Activity log'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-6 block w-full rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Get Started
              </Link>
            </div>
            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </span>
              </div>
              <p className="text-sm font-medium text-blue-600">Pro</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">$49</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Unlimited reviews + AI replies</p>
              <ul className="mt-6 space-y-2">
                {['AI-generated replies', 'Auto-polling every 15 min', 'Custom tone & instructions'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="mt-6 block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
              >
                Start Pro Trial
              </Link>
            </div>
            {/* Business */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Business</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">$99</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Full automation + priority support</p>
              <ul className="mt-6 space-y-2">
                {['Everything in Pro', 'Auto-publish replies', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="mt-6 block w-full rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Start Business Trial
              </Link>
            </div>
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
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-700">
              Privacy
            </a>
            <a href="#" className="hover:text-gray-700">
              Terms
            </a>
            <a href="#" className="hover:text-gray-700">
              Support
            </a>
            <a href="#" className="hover:text-gray-700">
              Contact
            </a>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 ReviewFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-600">{description}</p>
    </div>
  )
}
