'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  MessageSquareText,
  RefreshCw,
  Star,
  BarChart3,
  MessageCircle,
  Send,
  Clock,
  Settings,
  Activity,
  LogOut,
  Check,
  X,
  Pencil,
} from 'lucide-react'
import { StarRating } from '@/components/star-rating'
import { StatusBadge } from '@/components/status-badge'
import { EditReplyModal } from '@/components/edit-reply-modal'
import { ImpersonationBanner } from '@/components/impersonation-banner'
import { AppLogo } from '@/components/app-logo'
import { GettingStartedChecklist } from '@/components/getting-started-checklist'
import { Suspense } from 'react'
import type { Review, DashboardStats } from '@/lib/types'

type FilterTab = 'all' | 'needs_reply' | 'published' | 'skipped'

export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <DashboardPage />
    </Suspense>
  )
}

function DashboardPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [planId, setPlanId] = useState<string>('free')
  const router = useRouter()
  const searchParams = useSearchParams()
  const impersonateId = searchParams.get('impersonate')

  // Build query string suffix for impersonation
  const qs = impersonateId ? `&impersonate=${impersonateId}` : ''
  const qsFirst = impersonateId ? `?impersonate=${impersonateId}` : ''

  const fetchReviews = useCallback(async () => {
    const res = await fetch(`/api/reviews?status=${filter === 'all' ? '' : filter}${qs}`)
    if (res.ok) {
      const data = await res.json()
      setReviews(data.reviews)
    }
  }, [filter, qs])

  const fetchStats = async () => {
    const res = await fetch(`/api/stats${qsFirst}`)
    if (res.ok) {
      const data = await res.json()
      setStats(data)
    }
  }

  const fetchPlan = async () => {
    const res = await fetch(`/api/settings${qsFirst}`)
    if (res.ok) {
      const data = await res.json()
      setPlanId(data.profile?.plan_id || 'free')
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchReviews(), fetchStats(), fetchPlan()])
      setLoading(false)
    }
    init()
  }, [fetchReviews])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/reviews/refresh', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        await Promise.all([fetchReviews(), fetchStats()])
      } else {
        toast.error(data.error || 'Failed to refresh reviews')
      }
    } catch {
      toast.error('Failed to refresh reviews')
    }
    setRefreshing(false)
  }

  const handleApprove = async (reviewId: string) => {
    try {
      const res = await fetch('/api/replies/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Reply published successfully!')
        await Promise.all([fetchReviews(), fetchStats()])
      } else {
        toast.error(data.error || 'Failed to approve reply')
      }
    } catch {
      toast.error('Failed to approve reply')
    }
  }

  const handleEdit = async (reviewId: string, editedText: string) => {
    const res = await fetch('/api/replies/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, edited_text: editedText }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Reply edited and published!')
      await Promise.all([fetchReviews(), fetchStats()])
    } else {
      toast.error(data.error || 'Failed to edit reply')
      throw new Error(data.error)
    }
  }

  const handleSkip = async (reviewId: string) => {
    try {
      const res = await fetch('/api/replies/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId }),
      })
      if (res.ok) {
        toast.success('Review skipped')
        await Promise.all([fetchReviews(), fetchStats()])
      } else {
        toast.error('Failed to skip review')
      }
    } catch {
      toast.error('Failed to skip review')
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'needs_reply', label: 'Needs Reply' },
    { key: 'published', label: 'Published' },
    { key: 'skipped', label: 'Skipped' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-56 border-r border-gray-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b px-5 py-4">
            <AppLogo />
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
            >
              <BarChart3 size={18} />
              Dashboard
            </Link>
            <Link
              href="/activity"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Activity size={18} />
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
            <AppLogo size="small" />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/activity" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
              <Activity size={20} />
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
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {/* Page header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh Reviews'}
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={<Star className="h-5 w-5 text-amber-500" />}
                label="Reviews This Month"
                value={stats.total_reviews_this_month}
              />
              <StatCard
                icon={<Star className="h-5 w-5 text-amber-500" />}
                label="Avg Rating"
                value={stats.average_rating_this_month || '—'}
              />
              <StatCard
                icon={<Clock className="h-5 w-5 text-blue-500" />}
                label="Awaiting Reply"
                value={stats.reviews_awaiting_reply}
              />
              <StatCard
                icon={<Send className="h-5 w-5 text-green-500" />}
                label="Published This Month"
                value={stats.replies_published_this_month}
              />
            </div>
          )}

          {/* Getting Started Checklist */}
          <GettingStartedChecklist impersonateQs={qsFirst} />

          {/* Upgrade banner */}
          {planId === 'free' && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Start your 14-day free trial
                </p>
                <p className="mt-0.5 text-sm text-emerald-700">
                  Upgrade to ReviewFlow Pro for AI-generated replies, auto-polling, auto-publish, and more.
                </p>
              </div>
              <Link
                href="/pricing"
                className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Upgrade
              </Link>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="py-20 text-center text-gray-400">Loading...</div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-20 text-center">
              <MessageCircle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium text-gray-900">No reviews yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Click &ldquo;Refresh Reviews&rdquo; to pull your latest Google reviews.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onApprove={handleApprove}
                  onEdit={() => setEditingReview(review)}
                  onSkip={handleSkip}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editingReview && (
        <EditReplyModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function ReviewCard({
  review,
  onApprove,
  onEdit,
  onSkip,
}: {
  review: Review
  onApprove: (id: string) => void
  onEdit: () => void
  onSkip: (id: string) => void
}) {
  const [approving, setApproving] = useState(false)
  const [skipping, setSkipping] = useState(false)

  const handleApprove = async () => {
    setApproving(true)
    await onApprove(review.id)
    setApproving(false)
  }

  const handleSkip = async () => {
    setSkipping(true)
    await onSkip(review.id)
    setSkipping(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Review Header */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {review.reviewer_photo_url ? (
              <img
                src={review.reviewer_photo_url}
                alt={review.reviewer_name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-500">
                {review.reviewer_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{review.reviewer_name}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <StarRating rating={review.star_rating} size={14} />
                <span className="text-xs text-gray-400">
                  {format(new Date(review.review_created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
          <StatusBadge status={review.status} />
        </div>

        {review.review_text ? (
          <p className="mt-3 text-sm leading-relaxed text-gray-700">
            {review.review_text}
          </p>
        ) : (
          <p className="mt-3 text-sm italic text-gray-400">
            Rating only — no review text
          </p>
        )}
      </div>

      {/* Reply Section */}
      {review.reply && review.status === 'reply_generated' && (
        <div className="border-t border-gray-100 bg-blue-50/50 p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-blue-600">
            AI Draft Reply
          </p>
          <p className="mb-4 text-sm leading-relaxed text-gray-700">
            {review.reply.final_text}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Check size={14} />
              {approving ? 'Publishing...' : 'Approve'}
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Pencil size={14} />
              Edit
            </button>
            <button
              onClick={handleSkip}
              disabled={skipping}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <X size={14} />
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Published reply */}
      {review.reply && review.status === 'published' && (
        <div className="border-t border-gray-100 bg-green-50/50 p-5">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-green-600">
              Published Reply
            </p>
            {review.reply.published_at && (
              <span className="text-xs text-gray-400">
                · {format(new Date(review.reply.published_at), 'MMM d, yyyy h:mm a')}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-gray-700">
            {review.reply.final_text}
          </p>
        </div>
      )}
    </div>
  )
}
