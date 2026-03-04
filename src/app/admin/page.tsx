'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  MessageSquareText,
  Users,
  Star,
  DollarSign,
  Trash2,
  ArrowLeft,
  Shield,
  LogOut,
  ChevronDown,
  Search,
  Link2,
  Unplug,
  Eye,
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  business_name: string | null
  plan_id: string | null
  google_connected: boolean
  subscription_status: string | null
  created_at: string
  review_count: number
}

interface AdminStats {
  total_users: number
  total_reviews: number
  mrr: number
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [changingPlan, setChangingPlan] = useState<string | null>(null)
  const router = useRouter()

  const fetchData = async () => {
    const res = await fetch('/api/admin/users')
    if (res.status === 403) {
      setError('Access denied. You are not an admin.')
      setLoading(false)
      return
    }
    if (!res.ok) {
      setError('Failed to load admin data')
      setLoading(false)
      return
    }
    const data = await res.json()
    setUsers(data.users)
    setStats(data.stats)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleChangePlan = async (userId: string, planId: string) => {
    setChangingPlan(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        await fetchData()
      } else {
        toast.error(data.error || 'Failed to update plan')
      }
    } catch {
      toast.error('Failed to update plan')
    }
    setChangingPlan(null)
  }

  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        setConfirmDelete(null)
        await fetchData()
      } else {
        toast.error(data.error || 'Failed to delete user')
      }
    } catch {
      toast.error('Failed to delete user')
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.business_name || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400">Loading admin panel...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <p className="text-lg font-semibold text-gray-900">{error}</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">ReviewFlow</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                Admin
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg p-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Users className="h-5 w-5 text-blue-500" />}
              label="Total Users"
              value={stats.total_users.toLocaleString()}
            />
            <StatCard
              icon={<Star className="h-5 w-5 text-amber-500" />}
              label="Total Reviews Processed"
              value={stats.total_reviews.toLocaleString()}
            />
            <StatCard
              icon={<DollarSign className="h-5 w-5 text-green-500" />}
              label="Monthly Recurring Revenue"
              value={`$${stats.mrr.toLocaleString()}`}
            />
          </div>
        )}

        {/* Search */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or business name..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <p className="shrink-0 text-sm text-gray-500">
            {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Users table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    User
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Signed Up
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Plan
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Reviews
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Google
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    {/* User info */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      {user.business_name && (
                        <p className="mt-0.5 text-xs text-gray-500">{user.business_name}</p>
                      )}
                    </td>

                    {/* Signup date */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </p>
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-4">
                      <div className="relative inline-block">
                        <select
                          value={user.plan_id || 'free'}
                          onChange={(e) => handleChangePlan(user.id, e.target.value)}
                          disabled={changingPlan === user.id}
                          className={`appearance-none rounded-full py-1 pl-3 pr-7 text-xs font-medium disabled:opacity-50 ${
                            user.plan_id === 'business'
                              ? 'bg-purple-100 text-purple-700'
                              : user.plan_id === 'pro'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="business">Business</option>
                        </select>
                        <ChevronDown
                          size={12}
                          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                      </div>
                    </td>

                    {/* Reviews */}
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {user.review_count}
                      </span>
                    </td>

                    {/* Google */}
                    <td className="px-5 py-4 text-center">
                      {user.google_connected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <Link2 size={12} />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Unplug size={12} />
                          No
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      {confirmDelete === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-red-600">Delete?</span>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard?impersonate=${user.id}`}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                            title="View as this user"
                          >
                            <Eye size={15} />
                          </Link>
                          <button
                            onClick={() => setConfirmDelete(user.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete user"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                      {search ? 'No users match your search' : 'No users yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
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
  value: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
