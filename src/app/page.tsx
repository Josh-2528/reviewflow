'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MessageSquareText,
  ArrowRight,
  CheckCircle2,
  Star,
  Link2,
  Sparkles,
  Send,
  Zap,
  ChevronDown,
  Phone,
  Eye,
  Quote,
} from 'lucide-react'
import { useBranding } from '@/components/branding-provider'

const NAVY = '#0f1729'

export default function LandingPage() {
  const { app_name, logo_url } = useBranding()

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ─── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1729]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            {logo_url ? (
              <img src={logo_url} alt={app_name} className="h-7 w-7 object-contain" />
            ) : (
              <MessageSquareText className="h-7 w-7 text-emerald-400" />
            )}
            <span className="text-xl font-bold text-white">{app_name}</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-300 transition-colors hover:text-white">Features</a>
            <a href="#pricing" className="text-sm font-medium text-gray-300 transition-colors hover:text-white">Pricing</a>
            <a href="https://carwashai.com.au" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-300 transition-colors hover:text-white">WashBot</a>
            <a href="#faq" className="text-sm font-medium text-gray-300 transition-colors hover:text-white">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-gray-300 transition-colors hover:text-white sm:block">
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero (dark navy) ───────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-20 sm:pb-28 sm:pt-28" style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #1a2744 100%)` }}>
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left — copy */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
                <Sparkles size={14} />
                Bundled with WashBot
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
                Every Review Replied&nbsp;To.{' '}
                <span className="text-emerald-400">Zero Staff Time.</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-400">
                The AI review manager that monitors your Google reviews 24/7, writes
                human-sounding replies in your brand voice, and publishes them with
                one click — so you never lose a customer over an unanswered review.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/25"
                >
                  Start Free Trial
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/demo"
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-600 px-7 py-3.5 text-base font-semibold text-gray-300 transition-all hover:border-gray-500 hover:text-white"
                >
                  <Eye size={16} />
                  Try Live Demo
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  AI-Written Replies
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  One-Click Publish
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  100% Done-For-You Setup
                </span>
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/20 backdrop-blur-sm">
                <div className="rounded-xl bg-[#1a2744] p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                    </div>
                    <div className="ml-3 flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-gray-500">
                      reviewflow.app/dashboard
                    </div>
                  </div>

                  <div className="mb-3 grid grid-cols-4 gap-2">
                    {[
                      { label: 'This Month', val: '47' },
                      { label: 'Avg Rating', val: '4.6' },
                      { label: 'Pending', val: '3' },
                      { label: 'Published', val: '41' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg bg-white/5 p-2.5 text-center">
                        <p className="text-[10px] text-gray-500">{s.label}</p>
                        <p className="text-lg font-bold text-white">{s.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-white/[0.07] p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">M</div>
                        <div>
                          <p className="text-sm font-medium text-white">Marcus T.</p>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map((i) => <Star key={i} size={10} className="fill-amber-400 text-amber-400" />)}
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">Reply Ready</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-gray-400">
                      &ldquo;Best car wash in town! Got the full detail and my car looks brand new…&rdquo;
                    </p>
                    <div className="mt-3 rounded-md bg-emerald-500/10 p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">AI Draft</p>
                      <p className="text-xs leading-relaxed text-gray-300">
                        Thanks Marcus! Glad the full detail made your car shine. See you next time 🙌
                      </p>
                      <div className="mt-2.5 flex gap-1.5">
                        <span className="rounded bg-emerald-500 px-2.5 py-1 text-[10px] font-semibold text-white">Approve</span>
                        <span className="rounded bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-gray-300">Edit</span>
                        <span className="rounded bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-gray-500">Skip</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 left-1/2 -z-10 h-24 w-3/4 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Partnership Badge ──────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-2 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">In Partnership With</p>
          <p className="text-xl font-bold tracking-tight text-gray-900">V8 Auto Carwash Group</p>
        </div>
      </section>

      {/* ─── Bundled with WashBot (light gray) ──────────────── */}
      <section className="bg-gray-50 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">Better Together</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Complete Customer Protection Stack</h2>
            <p className="mt-4 text-lg text-gray-500">
              WashBot intercepts complaints before they become reviews. {app_name} handles the ones that slip through.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-gray-900">WashBot</h3>
              <p className="mb-3 text-sm font-medium text-blue-600">AI Phone Receptionist</p>
              <p className="text-sm leading-relaxed text-gray-600">
                Answers calls, de-escalates angry customers, logs incidents 24/7. Catches complaints before they hit Google.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <MessageSquareText className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-gray-900">{app_name}</h3>
              <p className="mb-3 text-sm font-medium text-emerald-600">AI Review Manager</p>
              <p className="text-sm leading-relaxed text-gray-600">
                Monitors reviews, generates replies, publishes responses automatically. Handles the reviews that do get posted.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600"
            >
              Start Free Trial
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Problem Section (white) ────────────────────────── */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              What Happens When You Ignore a 1-Star Review?
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              It sits there. Forever. Telling every potential customer your business doesn&apos;t care.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { stat: '3 in 4', text: 'customers read Google reviews before visiting a car wash' },
              { stat: 'Over half', text: "won't visit a business with unanswered negative reviews" },
              { stat: '$572/yr', text: 'the average lifetime value of a single car wash customer lost to a bad review — based on $11/week average spend' },
            ].map((card) => (
              <div
                key={card.stat}
                className="rounded-2xl p-8 text-center"
                style={{ backgroundColor: NAVY }}
              >
                <p className="text-4xl font-extrabold text-emerald-400">{card.stat}</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works (light gray) ──────────────────────── */}
      <section id="features" className="scroll-mt-20 bg-gray-50 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">How It Works</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Set It Up Once. We Handle Every Review.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              number={1}
              icon={<Link2 className="h-6 w-6 text-emerald-500" />}
              title="Connect Google"
              description="Link your Google Business Profile in 30 seconds. We start monitoring immediately."
            />
            <StepCard
              number={2}
              icon={<Sparkles className="h-6 w-6 text-emerald-500" />}
              title="AI Writes The Reply"
              description="Every new review gets a smart, human-sounding reply drafted in your brand voice. Handles 1-star complaints and 5-star thank-yous differently."
            />
            <StepCard
              number={3}
              icon={<Send className="h-6 w-6 text-emerald-500" />}
              title="Approve & Publish"
              description="Review the draft, edit if you want, publish with one click. Or turn on auto-publish and never think about it again."
            />
          </div>
        </div>
      </section>

      {/* ─── See The AI In Action (white) ───────────────────── */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">Live Examples</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">See The AI In Action</h2>
            <p className="mt-4 text-lg text-gray-500">
              Real reviews. Real AI-drafted replies. Ready to publish in seconds.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* 1-star review */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">D</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Dave R.</p>
                    <div className="flex gap-0.5">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      {[2,3,4,5].map((i) => <Star key={i} size={13} className="text-gray-200" />)}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-700">
                  &ldquo;Machine ate my $20 and nobody answered the phone. Waited 30 minutes. Absolutely useless.&rdquo;
                </p>
              </div>
              <div className="border-t border-emerald-100 bg-emerald-50/60 p-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">AI Draft Reply</p>
                <p className="text-sm leading-relaxed text-gray-700">
                  Hi Dave, I&apos;m really sorry about your experience — that&apos;s not the standard we aim for. I&apos;ve flagged this with our maintenance team and we&apos;d like to make it right. Could you reach out to us directly so we can arrange a refund? We appreciate you letting us know.
                </p>
              </div>
            </div>

            {/* 5-star review */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600">S</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Sarah N.</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((i) => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-700">
                  &ldquo;Best car wash in the area! The full detail package is incredible, my car has never looked this good.&rdquo;
                </p>
              </div>
              <div className="border-t border-emerald-100 bg-emerald-50/60 p-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">AI Draft Reply</p>
                <p className="text-sm leading-relaxed text-gray-700">
                  Thanks so much Sarah! Really glad the full detail left your car sparkling. We love hearing that — see you next time!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Results Section (dark navy) ────────────────────── */}
      <section className="px-6 py-20 sm:py-28" style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #162033 100%)` }}>
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">Results</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">What To Expect</h2>
          </div>

          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[
              { value: '2 min', label: 'Average reply time with auto-polling enabled' },
              { value: '100%', label: 'Review response rate' },
              { value: '24/7', label: 'Reviews monitored and replied to around the clock' },
              { value: '12hrs', label: 'Saved per month (based on 40 reviews at 15 min each vs 2 min with AI)' },
            ].map((s) => (
              <div key={s.value} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
                <p className="text-3xl font-extrabold text-emerald-400 sm:text-4xl">{s.value}</p>
                <p className="mt-2 text-xs leading-relaxed text-gray-400 sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonial ────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Quote size={40} className="mx-auto mb-6 text-emerald-200" />
          <blockquote className="text-xl font-medium leading-relaxed text-gray-800 sm:text-2xl">
            &ldquo;I don&apos;t have the time to reply to every review. I only reply to the bad ones — it would be good for the good ones to get recognition too.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm font-semibold text-gray-500">
            — Jordan, Owner, V8 Auto Carwash Group
          </p>
          <p className="mt-3 text-sm font-medium text-emerald-600">
            That&apos;s exactly what {app_name} does.
          </p>
        </div>
      </section>

      {/* ─── Pricing (light gray) ──────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 bg-gray-50 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">Pricing</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Pricing That Pays For Itself In Saved Customers
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              One lost regular costs you $572/year. {app_name} costs less than losing a single customer.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Pro */}
            <PricingCard
              name="ReviewFlow Pro"
              price={88}
              description="Everything you need. Up to 3 locations."
              features={[
                'Unlimited reviews',
                'AI-generated replies',
                'Auto-polling every 15 min',
                'Custom tone & voice',
                'Email notifications',
                'Auto-publish replies',
                'Weekly summary emails',
                'Priority support',
                'Up to 3 Google Business locations',
              ]}
              cta="Start 14-Day Free Trial"
              ctaHref="/signup"
              variant="popular"
              badge="14-Day Free Trial"
            />

            {/* Enterprise */}
            <div className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Enterprise</h3>
                <p className="mt-2 text-sm font-medium text-gray-500">For operators with 4+ locations</p>
              </div>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-600">
                Custom pricing, dedicated onboarding, and volume discounts for larger operations.
              </p>
              <a
                href="mailto:admin@carwashai.com.au?subject=ReviewFlow%20Enterprise%20Inquiry"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Contact Us
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ (light gray) ───────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Common Questions</h2>
          </div>

          <div className="space-y-3">
            <FaqItem
              question="How does the AI know what to say?"
              answer="It learns your business name, location, and tone preference. You can customize the voice to be friendly, professional, or casual. It handles positive reviews differently from negative ones — thanking happy customers and addressing concerns empathetically."
            />
            <FaqItem
              question="Will replies sound robotic?"
              answer="No. Every reply is unique and written to match your brand voice. Customers won't know it's AI."
            />
            <FaqItem
              question="What if I don't like a reply?"
              answer="Every reply is a draft first. You can edit it, regenerate it, or skip it entirely. Nothing gets published without your approval unless you enable auto-publish."
            />
            <FaqItem
              question="Does it work with multiple locations?"
              answer="Yes. Connect multiple Google Business Profiles and manage all your locations from one dashboard."
            />
            <FaqItem
              question="Can I cancel anytime?"
              answer="Yes. No contracts, no lock-in. Cancel anytime from your dashboard."
            />
            <FaqItem
              question="How does this work with WashBot?"
              answer="WashBot and ReviewFlow work as a complete reputation protection stack. Here's how they work together: A frustrated customer calls about a jammed machine — WashBot answers instantly, de-escalates the situation, and texts you an incident report. Problem resolved, no staff needed. But sometimes the customer still leaves a Google review. That's where ReviewFlow takes over — it detects the new review within minutes, drafts a professional empathetic reply in your brand voice, and queues it for your approval. One click and it's published. Between WashBot catching complaints on the phone and ReviewFlow handling reviews online, nothing slips through the cracks."
            />
          </div>
        </div>
      </section>

      {/* ─── Final CTA (dark navy) ──────────────────────────── */}
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Stop Losing Customers To Unanswered Reviews
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
            Join car wash operators who reply to every review in minutes, not days.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-xl"
            >
              Start Free Trial
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 px-6 py-12" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              {logo_url ? (
                <img src={logo_url} alt={app_name} className="h-6 w-6 object-contain" />
              ) : (
                <MessageSquareText className="h-6 w-6 text-emerald-400" />
              )}
              <span className="text-lg font-bold text-white">{app_name}</span>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <a href="#features" className="text-sm text-gray-400 transition-colors hover:text-white">Features</a>
              <a href="#pricing" className="text-sm text-gray-400 transition-colors hover:text-white">Pricing</a>
              <a href="#faq" className="text-sm text-gray-400 transition-colors hover:text-white">FAQ</a>
              <Link href="/terms" className="text-sm text-gray-400 transition-colors hover:text-white">Terms</Link>
              <Link href="/login" className="text-sm text-gray-400 transition-colors hover:text-white">Login</Link>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-8">
            <p className="text-sm text-gray-500">© 2026 {app_name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


/* ─── Subcomponents ─────────────────────────────────────────────── */

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
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">{icon}</div>
        <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-600">
          Step {number}
        </span>
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-600">{description}</p>
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
  features: string[]
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
          ? 'border-2 border-emerald-500 bg-white ring-1 ring-emerald-500/10'
          : 'border border-gray-200 bg-white'
      }`}
    >
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
            <Zap size={12} />
            {badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">{name}</h3>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-gray-900">${price}</span>
          <span className="text-gray-500">/month</span>
        </div>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${
          isPopular
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
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
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
      >
        <span className="pr-4 text-base font-semibold text-gray-900">{question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm leading-relaxed text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  )
}