'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { AppLogo } from '@/components/app-logo'
import {
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
  Palette,
  RotateCcw,
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

interface Branding {
  app_name: string
  logo_url: string | null
  primary_color: string
}

type AdminTab = 'users' | 'branding'

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [changingPlan, setChangingPlan] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('users')

  // Branding state
  const [branding, setBranding] = useState<Branding>({
    app_name: 'ReviewFlow',
    logo_url: null,
    primary_color: '#2563eb',
  })
  const [brandingForm, setBrandingForm] = useState<Branding>({
    app_name: 'ReviewFlow',
    logo_url: null,
    primary_color: '#2563eb',
  })
  const [savingBranding, setSavingBranding] = useState(false)

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

  const fetchBranding = async () => {
    const res = await fetch('/api/admin/branding')
    if (res.ok) {
      const data = await res.json()
      setBranding(data)
      setBrandingForm(data)
    }
  }

  useEffect(() => {
    fetchData()
    fetchBranding()
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

  const handleSaveBranding = async () => {
    setSavingBranding(true)
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandingForm),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Branding updated! Reload the page to see changes everywhere.')
        setBranding({ ...brandingForm })
        // Also update the CSS variable right away
        document.documentElement.style.setProperty(
          '--color-brand',
          brandingForm.primary_color
        )
      } else {
        toast.error(data.error || 'Failed to update branding')
      }
    } catch {
      toast.error('Failed to update branding')
    }
    setSavingBranding(false)
  }

  const handleResetBranding = () => {
    setBrandingForm({
      app_name: 'ReviewFlow',
      logo_url: null,
      primary_color: '#2563eb',
    })
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

  const brandingHasChanges =
    brandingForm.app_name !== branding.app_name ||
    brandingForm.logo_url !== branding.logo_url ||
    brandingForm.primary_color !== branding.primary_color

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
              <AppLogo />
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

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users size={16} />
            Users
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'branding'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Palette size={16} />
            Branding
          </button>
        </div>

        {/* Users tab */}
        {activeTab === 'users' && (
          <>
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
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900">{user.email}</p>
                          {user.business_name && (
                            <p className="mt-0.5 text-xs text-gray-500">{user.business_name}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-600">
                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="relative inline-block">
                            <select
                              value={user.plan_id || 'free'}
                              onChange={(e) => handleChangePlan(user.id, e.target.value)}
                              disabled={changingPlan === user.id}
                              className={`appearance-none rounded-full py-1 pl-3 pr-7 text-xs font-medium disabled:opacity-50 ${
                                user.plan_id === 'pro'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro ($88/mo)</option>
                            </select>
                            <ChevronDown
                              size={12}
                              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">
                            {user.review_count}
                          </span>
                        </td>
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
          </>
        )}

        {/* Branding tab */}
        {activeTab === 'branding' && (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <Palette className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  White-Label Branding
                </h2>
              </div>

              <p className="mb-6 text-sm text-gray-500">
                Customize how the app appears to your users. Change the name, logo, and
                primary color to match your brand.
              </p>

              {/* App Name */}
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  App Name
                </label>
                <input
                  type="text"
                  value={brandingForm.app_name}
                  onChange={(e) =>
                    setBrandingForm({ ...brandingForm, app_name: e.target.value })
                  }
                  placeholder="ReviewFlow"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  This replaces &quot;ReviewFlow&quot; across the entire app.
                </p>
              </div>

              {/* Logo URL */}
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={brandingForm.logo_url || ''}
                  onChange={(e) =>
                    setBrandingForm({
                      ...brandingForm,
                      logo_url: e.target.value || null,
                    })
                  }
                  placeholder="https://example.com/logo.png"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Paste a URL to your logo image. Recommended: square, 128×128px or
                  larger. Leave empty to use the default icon.
                </p>
                {brandingForm.logo_url && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                      <img
                        src={brandingForm.logo_url}
                        alt="Logo preview"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">Preview</span>
                  </div>
                )}
              </div>

              {/* Primary Color */}
              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandingForm.primary_color}
                    onChange={(e) =>
                      setBrandingForm({
                        ...brandingForm,
                        primary_color: e.target.value,
                      })
                    }
                    className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300"
                  />
                  <input
                    type="text"
                    value={brandingForm.primary_color}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                        setBrandingForm({ ...brandingForm, primary_color: v })
                      }
                    }}
                    placeholder="#2563eb"
                    className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div
                    className="h-10 flex-1 rounded-lg"
                    style={{ backgroundColor: brandingForm.primary_color }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Used for buttons, links, icons, and accents across the app.
                </p>
              </div>

              {/* Live Preview */}
              <div className="mb-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Live Preview
                </p>
                <div className="flex items-center gap-3">
                  {brandingForm.logo_url ? (
                    <img
                      src={brandingForm.logo_url}
                      alt="Preview"
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={brandingForm.primary_color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6"
                      >
                        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                      </svg>
                    </div>
                  )}
                  <span className="text-lg font-bold text-gray-900">
                    {brandingForm.app_name || 'ReviewFlow'}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: brandingForm.primary_color }}
                  >
                    Sample Button
                  </button>
                  <button
                    className="rounded-lg border px-4 py-2 text-sm font-medium"
                    style={{
                      borderColor: brandingForm.primary_color,
                      color: brandingForm.primary_color,
                    }}
                  >
                    Outline Button
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveBranding}
                  disabled={!brandingHasChanges || savingBranding}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingBranding ? 'Saving...' : 'Save Branding'}
                </button>
                <button
                  onClick={handleResetBranding}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <RotateCcw size={14} />
                  Reset to Default
                </button>
              </div>

              {/* Custom Domain Guide */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Custom Domain Setup
                </h3>
                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="mb-2 font-medium">
                    Point your own domain to this app:
                  </p>
                  <ol className="ml-4 list-decimal space-y-1.5 text-blue-800">
                    <li>
                      In your DNS provider, add a <strong>CNAME</strong> record
                      pointing your domain (e.g.{' '}
                      <code className="rounded bg-blue-100 px-1.5 py-0.5 text-xs">
                        reviews.yourbrand.com
                      </code>
                      ) to{' '}
                      <code className="rounded bg-blue-100 px-1.5 py-0.5 text-xs">
                        cname.vercel-dns.com
                      </code>
                    </li>
                    <li>
                      In your{' '}
                      <a
                        href="https://vercel.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline"
                      >
                        Vercel Dashboard
                      </a>
                      , go to <strong>Settings → Domains</strong> and add your
                      custom domain
                    </li>
                    <li>
                      Vercel will auto-provision an SSL certificate (takes ~5
                      minutes)
                    </li>
                    <li>
                      Update <code className="rounded bg-blue-100 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_APP_URL</code>{' '}
                      in your environment variables to match the new domain
                    </li>
                  </ol>
                  <p className="mt-3 text-xs text-blue-700">
                    Once your domain is set up, the branding above will apply
                    automatically — making the app fully white-labeled under your
                    brand.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
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
