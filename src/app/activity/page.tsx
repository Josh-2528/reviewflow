'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Suspense } from 'react'
import { ImpersonationBanner } from '@/components/impersonation-banner'
import {
  MessageSquareText,
  BarChart3,
  Activity as ActivityIcon,
  Settings,
  LogOut,
  Eye,
  Sparkles,
  Check,
  Send,
  Pencil,
  X,
} from 'lucide-react'
import type { ActivityLogEntry } from '@/lib/types'

const actionConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  review_detected: {
    icon: <Eye size={14} />,
    label: 'Review Detected',
    color: 'text-blue-600 bg-blue-100',
  },
  reply_generated: {
    icon: <Sparkles size={14} />,
    label: 'Reply Generated',
    color: 'text-purple-600 bg-purple-100',
  },
  reply_approved: {
    icon: <Check size={14} />,
    label: 'Reply Approved',
    color: 'text-green-600 bg-green-100',
  },
  reply_published: {
    icon: <Send size={14} />,
    label: 'Reply Published',
    color: 'text-green-600 bg-green-100',
  },
  reply_edited: {
    icon: <Pencil size={14} />,
    label: 'Reply Edited',
    color: 'text-amber-600 bg-amber-100',
  },
  reply_rejected: {
    icon: <X size={14} />,
    label: 'Reply Skipped',
    color: 'text-gray-600 bg-gray-100',
  },
}

export default function ActivityPageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <ActivityPage />
    </Suspense>
  )
}

function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const impersonateId = searchParams.get('impersonate')
  const qsFirst = impersonateId ? `?impersonate=${impersonateId}` : ''

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/activity${qsFirst}`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-56 border-r border-gray-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b px-5 py-4">
            <MessageSquareText className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">ReviewFlow</span>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <BarChart3 size={18} />
              Dashboard
            </Link>
            <Link
              href="/activity"
              className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
            >
              <ActivityIcon size={18} />
              Activity Log
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Settings size={18} />
              Settings
            </Link>
          </nav>
          <div className="border-t px-3 py-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-gray-900">ReviewFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
              <BarChart3 size={20} />
            </Link>
            <Link href="/settings" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
              <Settings size={20} />
            </Link>
            <button onClick={handleLogout} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-56">
        <ImpersonationBanner />
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <h1 className="mb-8 text-2xl font-bold text-gray-900">Activity Log</h1>

          {loading ? (
            <div className="py-20 text-center text-gray-400">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-20 text-center">
              <ActivityIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium text-gray-900">No activity yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Activity will appear here as reviews are detected and replies are
                managed.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {activities.map((activity, index) => {
                const config = actionConfig[activity.action] || {
                  icon: <ActivityIcon size={14} />,
                  label: activity.action,
                  color: 'text-gray-600 bg-gray-100',
                }

                return (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-4 px-5 py-4 ${
                      index < activities.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.color}`}
                    >
                      {config.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      {activity.details && (
                        <p className="mt-0.5 text-sm text-gray-600">
                          {activity.details}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
