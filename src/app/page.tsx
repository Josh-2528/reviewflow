import Link from 'next/link'
import {
  MessageSquareText,
  Sparkles,
  Send,
  Star,
  ArrowRight,
  CheckCircle2,
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
        <div className="mx-auto max-w-md">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Simple pricing
          </h2>
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                Professional
              </p>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900">$299</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Everything you need. No hidden fees.
              </p>
            </div>
            <ul className="mt-8 space-y-3">
              {[
                'Unlimited review monitoring',
                'AI-generated replies for every review',
                'One-click or auto publishing',
                'Custom tone & instructions',
                'Activity log & analytics',
                'Priority support',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 block w-full rounded-lg bg-blue-600 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
            >
              Start Free Trial
            </Link>
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
