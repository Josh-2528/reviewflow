'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Circle,
  Link2,
  MessageCircle,
  Send,
  Bell,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import type { OnboardingProgress } from '@/lib/types'

interface Step {
  key: keyof OnboardingProgress
  label: string
  description: string
  icon: React.ReactNode
  href: string
}

const steps: Step[] = [
  {
    key: 'google_connected',
    label: 'Connect Google Account',
    description: 'Link your Google Business Profile to start pulling reviews.',
    icon: <Link2 size={16} />,
    href: '/settings',
  },
  {
    key: 'has_reviewed_reply',
    label: 'Review your first AI reply',
    description: 'Approve or edit an AI-generated reply for one of your reviews.',
    icon: <MessageCircle size={16} />,
    href: '/dashboard',
  },
  {
    key: 'has_published_reply',
    label: 'Publish your first reply',
    description: 'Send a reply live to Google so your customers can see it.',
    icon: <Send size={16} />,
    href: '/dashboard',
  },
  {
    key: 'email_notifications_on',
    label: 'Set up email notifications',
    description: 'Get notified when new reviews come in or receive weekly summaries.',
    icon: <Bell size={16} />,
    href: '/settings',
  },
]

export function GettingStartedChecklist({
  impersonateQs,
}: {
  impersonateQs: string
}) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    fetch(`/api/onboarding-progress${impersonateQs}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.google_connected !== undefined) {
          setProgress(data)
        }
      })
      .catch(() => {})
  }, [impersonateQs])

  if (!progress) return null

  const completedCount = steps.filter((s) => progress[s.key]).length
  const allDone = completedCount === steps.length

  // If all steps are done and user has dismissed, don't show
  if (allDone) return null

  const percentage = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <Sparkles size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Getting Started</p>
            <p className="text-xs text-gray-500">
              {completedCount} of {steps.length} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-gray-100 sm:block">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500">{percentage}%</span>
          {collapsed ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronUp size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Steps */}
      {!collapsed && (
        <div className="border-t border-gray-100 px-5 py-3">
          {steps.map((step, i) => {
            const done = progress[step.key]
            return (
              <Link
                key={step.key}
                href={`${step.href}${impersonateQs}`}
                className={`flex items-start gap-3 rounded-lg px-3 py-3 transition-colors ${
                  done ? 'opacity-60' : 'hover:bg-gray-50'
                }`}
              >
                {done ? (
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-500" />
                ) : (
                  <Circle size={20} className="mt-0.5 shrink-0 text-gray-300" />
                )}
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      done ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{step.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
