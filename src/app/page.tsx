'use client'

import Link from 'next/link'
import {
  MessageSquareText,
  ArrowRight,
  CheckCircle2,
  Play,
  Star,
  Link2,
  Sparkles,
  Send,
  Shield,
  Clock,
  BarChart3,
  Zap,
  X,
  Mail,
} from 'lucide-react'
import { useBranding } from '@/components/branding-provider'

export default function LandingPage() {
  const { app_name, logo_url, primary_color } = useBranding()

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            {logo_url ? (
              <img src={logo_url} alt={app_name} className="h-7 w-7 object-contain" />
            ) : (
              <MessageSquareText className="h-7 w-7" style={{ color: primary_color }} />
            )}
            <span className="text-xl font-bold text-gray-900">{app_name}</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block"
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

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-16 pt-20 sm:pb-24 sm:pt-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-blue-50 opacity-70 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <Sparkles size={14} />
              AI-powered review management
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Respond to every Google review{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                in seconds, not hours
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
              ReviewFlow detects new reviews, generates smart AI replies, and
              publishes them to Google — so you can focus on running your business.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 sm:w-auto"
              >
                Start Free Trial
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/demo"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
              >
                <Play size={16} className="text-blue-600" />
                Try Live Demo
              </Link>
            </div>

            <p className="mt-5 text-sm text-gray-500">
              No credit card required · Free plan available · Set up in 2 minutes
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl shadow-gray-200/50">
              <div className="rounded-xl bg-gray-50 p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="ml-3 flex-1 rounded-lg bg-white px-4 py-1.5 text-xs text-gray-400">
                    app.reviewflow.com/dashboard
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Reviews This Month', value: '47', color: 'text-gray-900' },
                      { label: 'Avg Rating', value: '4.6', color: 'text-amber-500' },
                      { label: 'Awaiting Reply', value: '3', color: 'text-blue-600' },
                      { label: 'Published', value: '41', color: 'text-green-600' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-3">
                        <p className="text-xs text-gray-500">{stat.label}</p>
                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                          M
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Marcus T.</p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={12} className="fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Reply Ready
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      &ldquo;Best car wash in town. Got the full detail package and my car looks brand new...&rdquo;
                    </p>
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                      <p className="mb-1 text-xs font-medium text-blue-600">AI DRAFT REPLY</p>
                      <p className="text-sm text-gray-700">
                        Marcus, really glad you went with the full detail — we take pride in making every car look showroom-ready. See you next time!
                      </p>
                      <div className="mt-3 flex gap-2">
                        <div className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white">Approve</div>
                        <div className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white">Edit</div>
                        <div className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500">Skip</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -z-10 h-32 w-3/4 -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl" />
          </div>
        </div>
      </section>

      {/* ─── Logos / social proof bar ───────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50/50 px-6 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-6 text-sm font-medium uppercase tracking-wider text-gray-400">
            Trusted by 500+ local businesses
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-40">
            {['Café Luna', 'Sparkle Auto', 'GreenLeaf Dental', 'Urban Cuts', 'Peak Fitness'].map((name) => (
              <span key={name} className="text-lg font-bold tracking-tight text-gray-900">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">How It Works</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Three steps to effortless review management
            </h2>
            <p className="mt-4 text-lg text-gray-600">Set it up once. ReviewFlow handles the rest.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              number={1}
              icon={<Link2 className="h-6 w-6 text-blue-600" />}
              title="Connect Google Business"
              description="Link your Google Business Profile in one click. We'll start monitoring your reviews immediately — no technical setup required."
            />
            <StepCard
              number={2}
              icon={<Sparkles className="h-6 w-6 text-blue-600" />}
              title="AI generates replies"
              description="Every new review gets a personalized, human-sounding reply drafted by AI. Tailored to your tone, your business, and the specific review."
            />
            <StepCard
              number={3}
              icon={<Send className="h-6 w-6 text-blue-600" />}
              title="Approve & publish"
              description="Review the AI draft, edit if you like, and publish with one click. Or enable auto-publish and let ReviewFlow handle it entirely."
            />
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────── */}
      <section className="bg-gray-50 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">Features</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need, nothing you don&apos;t
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={<Clock className="h-5 w-5" />} title="Real-time monitoring" description="Reviews are detected within minutes, 24/7. Never let a review sit unanswered again." />
            <FeatureCard icon={<Sparkles className="h-5 w-5" />} title="Smart AI replies" description="Not generic templates — genuine, specific replies that reference what each reviewer actually said." />
            <FeatureCard icon={<BarChart3 className="h-5 w-5" />} title="Dashboard & analytics" description="Track your review volume, average rating, response rate, and trends over time." />
            <FeatureCard icon={<Shield className="h-5 w-5" />} title="Brand-safe tone control" description="Set your voice — casual, professional, warm, or direct. Add custom instructions the AI always follows." />
            <FeatureCard icon={<Mail className="h-5 w-5" />} title="Email notifications" description="Get instant alerts for new reviews and weekly summary reports delivered to your inbox." />
            <FeatureCard icon={<Zap className="h-5 w-5" />} title="Auto-publish" description="On the Business plan, replies go live automatically. Zero manual work required." />
          </div>
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">Testimonials</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Loved by business owners</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <TestimonialCard
              quote="ReviewFlow cut our review response time from 2 days to 2 minutes. Absolute game changer for our café."
              name="Sarah K."
              role="Café Owner, Melbourne"
              rating={5}
            />
            <TestimonialCard
              quote="The AI replies sound like me — not like a robot. My customers can't tell the difference and I save hours every week."
              name="James R."
              role="Auto Detailer, Sydney"
              rating={5}
            />
            <TestimonialCard
              quote="We went from ignoring bad reviews to addressing every single one professionally. Our rating went from 3.8 to 4.5."
              name="Priya M."
              role="Dental Practice Manager"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* ─── Pricing ────────────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 bg-gray-50 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">Pricing</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Simple plans that grow with you</h2>
            <p className="mt-4 text-lg text-gray-600">Start free. No credit card required. Upgrade anytime.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <PricingCard
              name="Free"
              price={0}
              description="Perfect for getting started"
              features={[
                { text: 'Up to 10 reviews/month', included: true },
                { text: 'Manual review polling', included: true },
                { text: 'Basic dashboard', included: true },
                { text: 'Activity log', included: true },
                { text: 'AI-generated replies', included: false },
                { text: 'Auto-polling', included: false },
                { text: 'Auto-publish', included: false },
                { text: 'Priority support', included: false },
              ]}
              cta="Get Started Free"
              ctaHref="/signup"
              variant="default"
            />
            <PricingCard
              name="Pro"
              price={49}
              description="For businesses serious about reviews"
              features={[
                { text: 'Unlimited reviews', included: true },
                { text: 'AI-generated replies', included: true },
                { text: 'Auto-polling every 15 min', included: true },
                { text: 'Custom tone & instructions', included: true },
                { text: 'Email notifications', included: true },
                { text: 'Analytics dashboard', included: true },
                { text: 'Auto-publish', included: false },
                { text: 'Priority support', included: false },
              ]}
              cta="Start Pro Trial"
              ctaHref="/signup"
              variant="popular"
              badge="Most Popular"
            />
            <PricingCard
              name="Business"
              price={99}
              description="Full automation, zero effort"
              features={[
                { text: 'Everything in Pro', included: true },
                { text: 'Auto-publish replies', included: true },
                { text: 'Priority support', included: true },
                { text: 'Dedicated account manager', included: true },
                { text: 'Unlimited reviews', included: true },
                { text: 'AI-generated replies', included: true },
                { text: 'Custom tone & instructions', included: true },
                { text: 'Weekly summary emails', included: true },
              ]}
              cta="Start Business Trial"
              ctaHref="/signup"
              variant="default"
            />
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Common questions</h2>
          </div>

          <div className="divide-y divide-gray-200">
            <FaqItem
              question="How does the AI generate replies?"
              answer="We use Claude by Anthropic to craft replies that sound genuinely human. The AI reads the full review, considers your business context and preferred tone, and writes a specific, personal response — never a generic template. You can always edit before publishing."
            />
            <FaqItem
              question="Will the replies sound robotic?"
              answer="No. We specifically instruct the AI to avoid corporate-speak, excessive exclamation marks, and phrases like 'Thank you for your review.' The replies reference what the reviewer actually said and match the tone you set."
            />
            <FaqItem
              question="What happens on the Free plan when I hit 10 reviews?"
              answer="New reviews will still be saved to your dashboard, but the AI won't generate automatic replies. You can write replies manually, or upgrade to Pro for unlimited AI-powered responses."
            />
            <FaqItem
              question="Can I edit replies before they go live?"
              answer="Absolutely. On the Free and Pro plans, every reply requires your approval before publishing. You can edit the text, then publish with one click. Only the Business plan offers auto-publish, and even then you can review everything in your dashboard."
            />
            <FaqItem
              question="How quickly are new reviews detected?"
              answer="On Pro and Business plans, we poll Google every 15 minutes. On the Free plan, you can manually refresh anytime. Either way, you'll know about new reviews fast."
            />
            <FaqItem
              question="Can I switch plans or cancel anytime?"
              answer="Yes to both. Upgrade, downgrade, or cancel from your Settings page at any time. No contracts, no hidden fees. Changes take effect immediately with prorated billing."
            />
            <FaqItem
              question="Do I need any technical knowledge?"
              answer="None. Connect your Google Business Profile with one click, set your preferred tone, and you're done. The whole setup takes about 2 minutes."
            />
            <FaqItem
              question="Is my Google account data safe?"
              answer="Yes. We use Google's official OAuth 2.0 flow and only request the permissions we need. We never store your Google password, and you can disconnect at any time from Settings."
            />
          </div>
        </div>
      </section>

      {/* ─── Final CTA ──────────────────────────────────────────── */}
      <section className="bg-blue-600 px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Stop ignoring reviews. Start growing your reputation.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
            Join 500+ businesses using ReviewFlow to respond to every review with AI-powered precision.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-600 shadow-lg transition-all hover:bg-blue-50 sm:w-auto"
            >
              Start Free Trial
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/demo"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-blue-500 sm:w-auto"
            >
              <Play size={16} />
              Try Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2">
                {logo_url ? (
                  <img src={logo_url} alt={app_name} className="h-6 w-6 object-contain" />
                ) : (
                  <MessageSquareText className="h-6 w-6" style={{ color: primary_color }} />
                )}
                <span className="text-lg font-bold text-gray-900">{app_name}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                AI-powered Google review management for local businesses. Respond faster, look better, grow stronger.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Product</h4>
              <ul className="space-y-2.5">
                <li><a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">How It Works</a></li>
                <li><a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a></li>
                <li><Link href="/demo" className="text-sm text-gray-600 hover:text-gray-900">Live Demo</Link></li>
                <li><a href="#faq" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Company</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">About</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Careers</a></li>
                <li><a href="mailto:support@reviewflow.app" className="text-sm text-gray-600 hover:text-gray-900">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Legal</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
            <p className="text-sm text-gray-400">© 2026 {app_name}. All rights reserved.</p>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <span>Made with</span>
              <span className="text-red-400">♥</span>
              <span>in Melbourne</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ─── Subcomponents ─────────────────────────────────────────────────── */

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: number
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">{icon}</div>
        <span className="text-sm font-bold text-blue-600">Step {number}</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-600">{description}</p>
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
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-600">{description}</p>
    </div>
  )
}

function TestimonialCard({
  quote,
  name,
  role,
  rating,
}: {
  quote: string
  name: string
  role: string
  rating: number
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex gap-0.5">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-gray-700">&ldquo;{quote}&rdquo;</p>
      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
    </div>
  )
}

function PricingCard({
  name,
  price,
  description,
  features,
  cta,
  ctaHref,
  variant,
  badge,
}: {
  name: string
  price: number
  description: string
  features: { text: string; included: boolean }[]
  cta: string
  ctaHref: string
  variant: 'default' | 'popular'
  badge?: string
}) {
  const isPopular = variant === 'popular'

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-8 shadow-sm ${
        isPopular
          ? 'border-2 border-blue-600 bg-white ring-1 ring-blue-600/10'
          : 'border border-gray-200 bg-white'
      }`}
    >
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
            <Zap size={12} />
            {badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gray-900">${price}</span>
          {price > 0 && <span className="text-gray-500">/month</span>}
        </div>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature.text} className="flex items-center gap-3 text-sm">
            {feature.included ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <X className="h-4 w-4 shrink-0 text-gray-300" />
            )}
            <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${
          isPopular
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        {cta}
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="py-6">
      <h3 className="text-base font-semibold text-gray-900">{question}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{answer}</p>
    </div>
  )
}
