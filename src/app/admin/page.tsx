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
  Sparkles,
  Settings,
  X,
  Loader2,
  TestTube,
  FlaskConical,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import type { AIPromptSettings } from '@/lib/types'

interface AdminUser {
  id: string
  email: string
  business_name: string | null
  plan_id: string | null
  google_connected: boolean
  subscription_status: string | null
  created_at: string
  review_count: number
  location_count: number
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

type AdminTab = 'users' | 'branding' | 'ai-prompts' | 'usage'

interface UsageSummary {
  total_cost_month: number
  total_calls_month: number
  avg_cost_per_reply: number
}

interface UsageUserBreakdown {
  email: string
  business_name: string | null
  calls_today: number
  calls_month: number
  cost_today: number
  cost_month: number
  total_cost: number
}

interface UsageDailyBreakdown {
  date: string
  calls: number
  cost: number
  input_tokens: number
  output_tokens: number
}

const emptyAISettings: Partial<AIPromptSettings> = {
  base_system_prompt: '',
  star_1_instructions: '',
  star_2_instructions: '',
  star_3_instructions: '',
  star_4_instructions: '',
  star_5_instructions: '',
  business_context: '',
  custom_instructions: '',
  contact_email: '',
  contact_phone: '',
  contact_reference_style: 'email us at',
  contact_include_on: 'negative_only',
  tone: 'friendly',
  custom_tone_description: '',
  sign_off: '',
  do_not_mention: '',
  always_mention: '',
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [changingPlan, setChangingPlan] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('users')

  // Branding
  const [branding, setBranding] = useState<Branding>({ app_name: 'ReviewFlow', logo_url: null, primary_color: '#2563eb' })
  const [brandingForm, setBrandingForm] = useState<Branding>({ app_name: 'ReviewFlow', logo_url: null, primary_color: '#2563eb' })
  const [savingBranding, setSavingBranding] = useState(false)

  // Global AI
  const [globalAI, setGlobalAI] = useState<Partial<AIPromptSettings>>(emptyAISettings)
  const [savingGlobalAI, setSavingGlobalAI] = useState(false)
  const [previewingGlobal, setPreviewingGlobal] = useState(false)
  const [globalPreview, setGlobalPreview] = useState<{ oneStarReply: string; fiveStarReply: string } | null>(null)

  // Customer AI modal
  const [configUser, setConfigUser] = useState<AdminUser | null>(null)
  const [customerAI, setCustomerAI] = useState<Partial<AIPromptSettings>>(emptyAISettings)
  const [customerAutoPublishStars, setCustomerAutoPublishStars] = useState<number[]>([4, 5])
  const [savingCustomerAI, setSavingCustomerAI] = useState(false)
  const [previewingCustomer, setPreviewingCustomer] = useState(false)
  const [customerPreview, setCustomerPreview] = useState<{ oneStarReply: string; fiveStarReply: string } | null>(null)

  // Test review modal
  const [testReviewUser, setTestReviewUser] = useState<AdminUser | null>(null)
  const [testReviewName, setTestReviewName] = useState('Test Reviewer')
  const [testReviewStars, setTestReviewStars] = useState(5)
  const [testReviewText, setTestReviewText] = useState('')
  const [testReviewLocationId, setTestReviewLocationId] = useState('')
  const [testReviewLocations, setTestReviewLocations] = useState<{ id: string; location_name: string | null }[]>([])
  const [submittingTestReview, setSubmittingTestReview] = useState(false)
  const [testReviewResult, setTestReviewResult] = useState<{
    message: string
    status: string
    auto_publish_triggered: boolean
    reply_preview: string
  } | null>(null)

  // Usage tab
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null)
  const [usageUsers, setUsageUsers] = useState<UsageUserBreakdown[]>([])
  const [usageDaily, setUsageDaily] = useState<UsageDailyBreakdown[]>([])
  const [usageLoading, setUsageLoading] = useState(false)
  const [usageSearch, setUsageSearch] = useState('')

  const router = useRouter()

  const fetchData = async () => {
    const res = await fetch('/api/admin/users')
    if (res.status === 403) { setError('Access denied. You are not an admin.'); setLoading(false); return }
    if (!res.ok) { setError('Failed to load admin data'); setLoading(false); return }
    const data = await res.json()
    setUsers(data.users)
    setStats(data.stats)
    setLoading(false)
  }

  const fetchBranding = async () => {
    const res = await fetch('/api/admin/branding')
    if (res.ok) { const data = await res.json(); setBranding(data); setBrandingForm(data) }
  }

  const fetchGlobalAI = async () => {
    const res = await fetch('/api/admin/ai-prompts')
    if (res.ok) { const data = await res.json(); if (data.global) setGlobalAI({ ...emptyAISettings, ...data.global }) }
  }

  const fetchUsage = async () => {
    setUsageLoading(true)
    try {
      const res = await fetch('/api/admin/usage')
      if (!res.ok) { toast.error('Failed to load usage data'); return }
      const data = await res.json()
      setUsageSummary(data.summary)
      setUsageUsers(data.user_breakdown)
      setUsageDaily(data.daily_breakdown)
    } catch {
      toast.error('Failed to load usage data')
    } finally {
      setUsageLoading(false)
    }
  }

  useEffect(() => { fetchData(); fetchBranding(); fetchGlobalAI() }, [])

  useEffect(() => {
    if (activeTab === 'usage' && !usageSummary) {
      fetchUsage()
    }
  }, [activeTab])

  // ── User handlers ────────────────────────────────
  const handleChangePlan = async (userId: string, planId: string) => {
    setChangingPlan(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan_id: planId }) })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); await fetchData() } else toast.error(data.error || 'Failed to update plan')
    } catch { toast.error('Failed to update plan') }
    setChangingPlan(null)
  }

  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); setConfirmDelete(null); await fetchData() } else toast.error(data.error || 'Failed to delete user')
    } catch { toast.error('Failed to delete user') }
  }

  // ── Branding handlers ────────────────────────────
  const handleSaveBranding = async () => {
    setSavingBranding(true)
    try {
      const res = await fetch('/api/admin/branding', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brandingForm) })
      if (res.ok) { toast.success('Branding updated!'); setBranding({ ...brandingForm }); document.documentElement.style.setProperty('--color-brand', brandingForm.primary_color) }
      else toast.error('Failed to update branding')
    } catch { toast.error('Failed to update branding') }
    setSavingBranding(false)
  }

  const handleResetBranding = () => { setBrandingForm({ app_name: 'ReviewFlow', logo_url: null, primary_color: '#2563eb' }) }

  // ── Global AI handlers ───────────────────────────
  const handleSaveGlobalAI = async () => {
    setSavingGlobalAI(true)
    try {
      const res = await fetch('/api/admin/ai-prompts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: null, ...globalAI }) })
      if (res.ok) toast.success('Global AI settings saved')
      else toast.error('Failed to save AI settings')
    } catch { toast.error('Failed to save AI settings') }
    setSavingGlobalAI(false)
  }

  const handlePreviewGlobal = async () => {
    setPreviewingGlobal(true); setGlobalPreview(null)
    try {
      const res = await fetch('/api/admin/ai-prompts/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: globalAI, businessName: 'Sample Car Wash', businessLocation: 'Melbourne, Australia' }) })
      if (res.ok) setGlobalPreview(await res.json())
      else toast.error('Failed to generate preview')
    } catch { toast.error('Failed to generate preview') }
    setPreviewingGlobal(false)
  }

  // ── Customer AI handlers ─────────────────────────
  const handleOpenCustomerConfig = async (user: AdminUser) => {
    setConfigUser(user); setCustomerAI(emptyAISettings); setCustomerPreview(null); setCustomerAutoPublishStars([4, 5])
    // Fetch AI settings
    const res = await fetch(`/api/admin/ai-prompts?user_id=${user.id}`)
    if (res.ok) { const data = await res.json(); if (data.customer) setCustomerAI({ ...emptyAISettings, ...data.customer }) }
    // Fetch user's auto_publish_stars
    const settingsRes = await fetch(`/api/settings?impersonate=${user.id}`)
    if (settingsRes.ok) { const data = await settingsRes.json(); if (data.profile?.auto_publish_stars) setCustomerAutoPublishStars(data.profile.auto_publish_stars) }
  }

  const handleSaveCustomerAI = async () => {
    if (!configUser) return
    setSavingCustomerAI(true)
    try {
      // Save AI prompt settings
      const res = await fetch('/api/admin/ai-prompts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: configUser.id, ...customerAI }) })
      // Also save auto_publish_stars via the admin impersonate settings endpoint
      const starsRes = await fetch(`/api/admin/users/${configUser.id}/auto-publish-stars`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ auto_publish_stars: customerAutoPublishStars }) })
      if (res.ok && starsRes.ok) toast.success(`AI settings saved for ${configUser.email}`)
      else toast.error('Failed to save some AI settings')
    } catch { toast.error('Failed to save AI settings') }
    setSavingCustomerAI(false)
  }

  const handlePreviewCustomer = async () => {
    if (!configUser) return
    setPreviewingCustomer(true); setCustomerPreview(null)
    try {
      const res = await fetch('/api/admin/ai-prompts/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: customerAI, businessName: configUser.business_name || 'Sample Car Wash', businessLocation: 'Melbourne, Australia' }) })
      if (res.ok) setCustomerPreview(await res.json())
      else toast.error('Failed to generate preview')
    } catch { toast.error('Failed to generate preview') }
    setPreviewingCustomer(false)
  }

  // ── Test Review handlers ──────────────────────────
  const handleOpenTestReview = async (user: AdminUser) => {
    setTestReviewUser(user)
    setTestReviewName('Test Reviewer')
    setTestReviewStars(5)
    setTestReviewText('')
    setTestReviewLocationId('')
    setTestReviewLocations([])
    setTestReviewResult(null)
    // Fetch user's locations
    const res = await fetch(`/api/settings?impersonate=${user.id}`)
    if (res.ok) {
      const data = await res.json()
      if (data.locations && data.locations.length > 0) {
        setTestReviewLocations(data.locations.map((l: { id: string; location_name: string | null }) => ({ id: l.id, location_name: l.location_name })))
        setTestReviewLocationId(data.locations[0].id)
      }
    }
  }

  const handleSubmitTestReview = async () => {
    if (!testReviewUser) return
    setSubmittingTestReview(true)
    setTestReviewResult(null)
    try {
      const res = await fetch('/api/admin/test-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: testReviewUser.id,
          reviewer_name: testReviewName,
          star_rating: testReviewStars,
          review_text: testReviewText || null,
          location_id: testReviewLocationId || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setTestReviewResult(data)
        toast.success('Test review injected and processed!')
      } else {
        toast.error(data.error || 'Failed to create test review')
      }
    } catch {
      toast.error('Failed to create test review')
    }
    setSubmittingTestReview(false)
  }

  const handleLogout = async () => { const supabase = createClient(); await supabase.auth.signOut(); router.push('/') }

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || (u.business_name || '').toLowerCase().includes(search.toLowerCase()))
  const brandingHasChanges = brandingForm.app_name !== branding.app_name || brandingForm.logo_url !== branding.logo_url || brandingForm.primary_color !== branding.primary_color

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-50"><p className="text-gray-400">Loading admin panel...</p></div>
  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Shield className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <p className="text-lg font-semibold text-gray-900">{error}</p>
        <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"><ArrowLeft size={14} />Back to Dashboard</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
            <div className="flex items-center gap-2">
              <AppLogo size="small" />
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Admin</span>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg p-2 text-sm text-gray-600 hover:bg-gray-100"><LogOut size={16} /></button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Stats */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={<Users className="h-5 w-5 text-blue-500" />} label="Total Users" value={stats.total_users.toLocaleString()} />
            <StatCard icon={<Star className="h-5 w-5 text-amber-500" />} label="Total Reviews Processed" value={stats.total_reviews.toLocaleString()} />
            <StatCard icon={<DollarSign className="h-5 w-5 text-green-500" />} label="Monthly Recurring Revenue" value={`$${stats.mrr.toLocaleString()}`} />
          </div>
        )}

        {/* Tab bar */}
        <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {([['users', Users, 'Users'], ['ai-prompts', Sparkles, 'AI Prompts'], ['usage', BarChart3, 'Usage'], ['branding', Palette, 'Branding']] as const).map(([key, Icon, label]) => (
              <button key={key} onClick={() => setActiveTab(key as AdminTab)} className={`flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════ USERS TAB ═══════════════ */}
        {activeTab === 'users' && (
          <>
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email or business name..." className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <p className="shrink-0 text-sm text-gray-500">{filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'}</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['User', 'Signed Up', 'Plan', 'Reviews', 'Locations', 'Google', 'Actions'].map((h, i) => (
                        <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${i >= 3 && i <= 5 ? 'text-center' : i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900">{user.email}</p>
                          {user.business_name && <p className="mt-0.5 text-xs text-gray-500">{user.business_name}</p>}
                        </td>
                        <td className="px-5 py-4"><p className="text-sm text-gray-600">{format(new Date(user.created_at), 'MMM d, yyyy')}</p></td>
                        <td className="px-5 py-4">
                          <div className="relative inline-block">
                            <select value={user.plan_id || 'free'} onChange={(e) => handleChangePlan(user.id, e.target.value)} disabled={changingPlan === user.id} className={`appearance-none rounded-full py-1 pl-3 pr-7 text-xs font-medium disabled:opacity-50 ${user.plan_id === 'pro' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                              <option value="free">Free</option>
                              <option value="pro">Pro ($88/mo)</option>
                            </select>
                            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center"><span className="text-sm font-medium text-gray-900">{user.review_count}</span></td>
                        <td className="px-5 py-4 text-center"><span className="text-sm text-gray-600">{user.location_count || 0}</span></td>
                        <td className="px-5 py-4 text-center">
                          {user.google_connected
                            ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><Link2 size={12} />Connected</span>
                            : <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Unplug size={12} />No</span>}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {confirmDelete === user.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-red-600">Delete?</span>
                              <button onClick={() => handleDelete(user.id)} className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700">Yes</button>
                              <button onClick={() => setConfirmDelete(null)} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">No</button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleOpenTestReview(user)} className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600" title="Test Review"><FlaskConical size={15} /></button>
                              <button onClick={() => handleOpenCustomerConfig(user)} className="rounded-lg p-1.5 text-gray-400 hover:bg-purple-50 hover:text-purple-600" title="Configure AI"><Settings size={15} /></button>
                              <Link href={`/dashboard?impersonate=${user.id}`} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="View as this user"><Eye size={15} /></Link>
                              <button onClick={() => setConfirmDelete(user.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete user"><Trash2 size={15} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">{search ? 'No users match your search' : 'No users yet'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════ AI PROMPTS TAB ═══════════════ */}
        {activeTab === 'ai-prompts' && (
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Global AI Defaults</h2>
                  <p className="text-sm text-gray-500">These apply to all customers unless they have custom overrides.</p>
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Base System Prompt</label>
                <textarea value={globalAI.base_system_prompt || ''} onChange={(e) => setGlobalAI({ ...globalAI, base_system_prompt: e.target.value })} rows={5} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Master system prompt sent to Claude for every reply..." />
              </div>

              <div className="mb-6">
                <p className="mb-3 text-sm font-medium text-gray-700">Star Rating Templates</p>
                {[1, 2, 3, 4, 5].map((star) => {
                  const key = `star_${star}_instructions` as keyof typeof globalAI
                  return (
                    <div key={star} className="mb-3">
                      <label className="mb-1 flex items-center gap-1.5 text-sm text-gray-600">{'⭐'.repeat(star)} {star}-Star Instructions</label>
                      <textarea value={(globalAI[key] as string) || ''} onChange={(e) => setGlobalAI({ ...globalAI, [key]: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleSaveGlobalAI} disabled={savingGlobalAI} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{savingGlobalAI ? 'Saving...' : 'Save Global Defaults'}</button>
                <button onClick={handlePreviewGlobal} disabled={previewingGlobal} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  {previewingGlobal ? <Loader2 size={14} className="animate-spin" /> : <TestTube size={14} />}Preview Replies
                </button>
              </div>

              {globalPreview && (
                <div className="mt-6 space-y-4">
                  <PreviewCard title="1-Star Review Reply" review="Terrible experience. The machine ate my $20 note and nobody was around to help." reply={globalPreview.oneStarReply} stars={1} />
                  <PreviewCard title="5-Star Review Reply" review="Best car wash in the area! Got the full detail package and my car has never looked this good." reply={globalPreview.fiveStarReply} stars={5} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ USAGE TAB ═══════════════ */}
        {activeTab === 'usage' && (
          <>
            {usageLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                {usageSummary && (
                  <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard icon={<DollarSign className="h-5 w-5 text-green-500" />} label="API Cost This Month" value={`$${usageSummary.total_cost_month.toFixed(2)}`} />
                    <StatCard icon={<BarChart3 className="h-5 w-5 text-blue-500" />} label="API Calls This Month" value={usageSummary.total_calls_month.toLocaleString()} />
                    <StatCard icon={<Sparkles className="h-5 w-5 text-purple-500" />} label="Avg Cost / Reply" value={`$${usageSummary.avg_cost_per_reply.toFixed(4)}`} />
                    <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <button onClick={fetchUsage} disabled={usageLoading} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                        <RefreshCw size={14} className={usageLoading ? 'animate-spin' : ''} />
                        Refresh
                      </button>
                    </div>
                  </div>
                )}

                {/* Per-User Breakdown */}
                <div className="mb-8">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Per-User Breakdown</h3>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={usageSearch}
                      onChange={(e) => setUsageSearch(e.target.value)}
                      placeholder="Search by email or business name..."
                      className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">User</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Calls Today</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Cost Today</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Calls Month</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Cost Month</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {usageUsers
                            .filter((u) =>
                              u.email?.toLowerCase().includes(usageSearch.toLowerCase()) ||
                              u.business_name?.toLowerCase().includes(usageSearch.toLowerCase())
                            )
                            .map((u) => (
                              <tr key={u.email} className="hover:bg-gray-50">
                                <td className="px-5 py-4">
                                  <p className="text-sm font-medium text-gray-900">{u.email}</p>
                                  {u.business_name && <p className="mt-0.5 text-xs text-gray-500">{u.business_name}</p>}
                                </td>
                                <td className="px-5 py-4 text-right text-sm text-gray-600">{u.calls_today}</td>
                                <td className="px-5 py-4 text-right text-sm text-gray-600">${u.cost_today.toFixed(4)}</td>
                                <td className="px-5 py-4 text-right text-sm text-gray-600">{u.calls_month}</td>
                                <td className="px-5 py-4 text-right text-sm font-medium text-gray-900">${u.cost_month.toFixed(4)}</td>
                                <td className="px-5 py-4 text-right text-sm text-gray-600">${u.total_cost.toFixed(2)}</td>
                              </tr>
                            ))}
                          {usageUsers.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">No API usage data yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Daily Breakdown */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Daily Breakdown (Last 30 Days)</h3>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">API Calls</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Input Tokens</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Output Tokens</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {usageDaily.map((day) => (
                            <tr key={day.date} className="hover:bg-gray-50">
                              <td className="px-5 py-3 text-sm text-gray-900">{format(new Date(day.date + 'T00:00:00'), 'MMM d, yyyy')}</td>
                              <td className="px-5 py-3 text-right text-sm text-gray-600">{day.calls}</td>
                              <td className="px-5 py-3 text-right text-sm text-gray-600">{day.input_tokens.toLocaleString()}</td>
                              <td className="px-5 py-3 text-right text-sm text-gray-600">{day.output_tokens.toLocaleString()}</td>
                              <td className="px-5 py-3 text-right text-sm font-medium text-gray-900">${day.cost.toFixed(4)}</td>
                            </tr>
                          ))}
                          {usageDaily.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">No usage data in the last 30 days</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════════ BRANDING TAB ═══════════════ */}
        {activeTab === 'branding' && (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <Palette className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">White-Label Branding</h2>
              </div>
              <p className="mb-6 text-sm text-gray-500">Customize how the app appears to your users.</p>

              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">App Name</label>
                <input type="text" value={brandingForm.app_name} onChange={(e) => setBrandingForm({ ...brandingForm, app_name: e.target.value })} placeholder="ReviewFlow" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Logo URL</label>
                <input type="url" value={brandingForm.logo_url || ''} onChange={(e) => setBrandingForm({ ...brandingForm, logo_url: e.target.value || null })} placeholder="https://example.com/logo.png" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                {brandingForm.logo_url && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                      <img src={brandingForm.logo_url} alt="Logo preview" className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                    <span className="text-xs text-gray-500">Preview</span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={brandingForm.primary_color} onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300" />
                  <input type="text" value={brandingForm.primary_color} onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setBrandingForm({ ...brandingForm, primary_color: e.target.value }) }} placeholder="#2563eb" className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: brandingForm.primary_color }} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleSaveBranding} disabled={!brandingHasChanges || savingBranding} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{savingBranding ? 'Saving...' : 'Save Branding'}</button>
                <button onClick={handleResetBranding} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"><RotateCcw size={14} />Reset to Default</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════ CUSTOMER AI CONFIG MODAL ═══════════════ */}
      {configUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-0 sm:p-4 sm:pt-12">
          <div className="relative flex min-h-full w-full flex-col bg-white sm:min-h-0 sm:max-w-3xl sm:rounded-2xl sm:shadow-2xl">
            {/* Modal header */}
            <div className="flex items-start justify-between border-b px-4 py-4 sm:px-6">
              <div className="min-w-0 pr-2">
                <h2 className="truncate text-lg font-semibold text-gray-900">Configure AI — {configUser.business_name || configUser.email}</h2>
                <p className="text-sm text-gray-500">Customer-specific overrides. Blank fields fall back to global defaults.</p>
              </div>
              <button onClick={() => setConfigUser(null)} className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X size={20} /></button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:max-h-[calc(100vh-200px)] sm:px-6">
              {/* Business Context */}
              <Section title="Business Context" description="Specific details the AI should know about this business.">
                <textarea value={customerAI.business_context || ''} onChange={(e) => setCustomerAI({ ...customerAI, business_context: e.target.value })} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder='e.g. "Self-serve car wash with 8 bays. Touch-free and manual options..."' />
              </Section>

              {/* Custom Instructions */}
              <Section title="Custom Instructions" description="Specific rules for this customer's replies.">
                <textarea value={customerAI.custom_instructions || ''} onChange={(e) => setCustomerAI({ ...customerAI, custom_instructions: e.target.value })} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder='e.g. "Always mention they can email for issues. Never offer refunds."' />
              </Section>

              {/* Contact Details */}
              <Section title="Contact Details for Replies" description="How the AI should direct unhappy customers.">
                <div className="grid grid-cols-1 gap-4 mb-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Contact Email</label>
                    <input type="email" value={customerAI.contact_email || ''} onChange={(e) => setCustomerAI({ ...customerAI, contact_email: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="camden@gmail.com" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Contact Phone (optional)</label>
                    <input type="text" value={customerAI.contact_phone || ''} onChange={(e) => setCustomerAI({ ...customerAI, contact_phone: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0400 123 456" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Reference Style</label>
                    <input type="text" value={customerAI.contact_reference_style || ''} onChange={(e) => setCustomerAI({ ...customerAI, contact_reference_style: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="email us at" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Include Contact On</label>
                    <select value={customerAI.contact_include_on || 'negative_only'} onChange={(e) => setCustomerAI({ ...customerAI, contact_include_on: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="negative_only">Only on negative reviews (1-3 stars)</option>
                      <option value="always">On all reviews</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
              </Section>

              {/* Tone */}
              <Section title="Tone" description="How the AI replies should sound.">
                <select value={customerAI.tone || 'friendly'} onChange={(e) => setCustomerAI({ ...customerAI, tone: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3">
                  <option value="friendly">Friendly & Casual</option>
                  <option value="professional">Professional & Warm</option>
                  <option value="formal">Formal & Corporate</option>
                  <option value="custom">Custom</option>
                </select>
                {customerAI.tone === 'custom' && (
                  <textarea value={customerAI.custom_tone_description || ''} onChange={(e) => setCustomerAI({ ...customerAI, custom_tone_description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Describe the custom tone..." />
                )}
              </Section>

              {/* Sign-off */}
              {/* Auto-publish Stars */}
              <Section title="Auto-Publish by Star Rating" description="Which star ratings should be auto-published vs held for approval.">
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const checked = customerAutoPublishStars.includes(star)
                    return (
                      <label key={star} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${checked ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>
                        <input type="checkbox" checked={checked} onChange={() => { if (checked) { setCustomerAutoPublishStars(customerAutoPublishStars.filter((s) => s !== star)) } else { setCustomerAutoPublishStars([...customerAutoPublishStars, star].sort()) } }} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        {'★'.repeat(star)} {star}-star
                      </label>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-400">Checked = auto-publish. Unchecked = draft for manual approval.</p>
              </Section>

              <Section title="Sign-off Style" description="How to end replies. Leave blank for no specific sign-off.">
                <input type="text" value={customerAI.sign_off || ''} onChange={(e) => setCustomerAI({ ...customerAI, sign_off: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder='e.g. "The team at Camden Car Wash" or "Thanks, Jordan @ V8 Auto"' />
              </Section>

              {/* Do Not Mention */}
              <Section title="Do NOT Mention" description="Things the AI should never say in replies.">
                <textarea value={customerAI.do_not_mention || ''} onChange={(e) => setCustomerAI({ ...customerAI, do_not_mention: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder='e.g. "Never mention competitor car washes. Never say the word cheap."' />
              </Section>

              {/* Always Mention */}
              <Section title="Always Mention" description="Things to always include when relevant.">
                <textarea value={customerAI.always_mention || ''} onChange={(e) => setCustomerAI({ ...customerAI, always_mention: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder='e.g. "Mention our new express detail service when relevant."' />
              </Section>

              {/* Star Rating Overrides */}
              <Section title="Star Rating Overrides" description="Override global defaults for this customer. Leave blank to use global templates.">
                {[1, 2, 3, 4, 5].map((star) => {
                  const key = `star_${star}_instructions` as keyof typeof customerAI
                  return (
                    <div key={star} className="mb-3">
                      <label className="mb-1 flex items-center gap-1.5 text-sm text-gray-600">{'⭐'.repeat(star)} {star}-Star Override</label>
                      <textarea value={(customerAI[key] as string) || ''} onChange={(e) => setCustomerAI({ ...customerAI, [key]: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Leave blank to use global default" />
                    </div>
                  )
                })}
              </Section>

              {/* Preview Results */}
              {customerPreview && (
                <div className="mt-2 space-y-4">
                  <PreviewCard title="1-Star Review Reply" review="Terrible experience. The machine ate my $20 note and nobody was around to help." reply={customerPreview.oneStarReply} stars={1} />
                  <PreviewCard title="5-Star Review Reply" review="Best car wash in the area! Got the full detail package and my car has never looked this good." reply={customerPreview.fiveStarReply} stars={5} />
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <button onClick={handlePreviewCustomer} disabled={previewingCustomer} className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                {previewingCustomer ? <Loader2 size={14} className="animate-spin" /> : <TestTube size={14} />}Preview Replies
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => setConfigUser(null)} className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 sm:flex-none">Cancel</button>
                <button onClick={handleSaveCustomerAI} disabled={savingCustomerAI} className="min-h-[44px] flex-1 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:flex-none">{savingCustomerAI ? 'Saving...' : 'Save Settings'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TEST REVIEW MODAL ═══════════════ */}
      {testReviewUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-none sm:max-w-lg sm:rounded-2xl">
            <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
              <div className="min-w-0 pr-2">
                <h2 className="truncate text-lg font-semibold text-gray-900">Inject Test Review</h2>
                <p className="truncate text-sm text-gray-500">{testReviewUser.business_name || testReviewUser.email}</p>
              </div>
              <button onClick={() => setTestReviewUser(null)} className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 sm:px-6">
              {testReviewLocations.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Location</label>
                  <select value={testReviewLocationId} onChange={(e) => setTestReviewLocationId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    {testReviewLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.location_name || 'Unnamed Location'}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Reviewer Name</label>
                <input type="text" value={testReviewName} onChange={(e) => setTestReviewName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Test Reviewer" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Star Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setTestReviewStars(star)} className={`flex-1 rounded-lg border py-2 text-center text-sm font-medium transition-colors ${testReviewStars === star ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {'★'.repeat(star)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Review Text <span className="text-gray-400">(optional)</span></label>
                <textarea value={testReviewText} onChange={(e) => setTestReviewText(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Write a test review..." />
              </div>

              {testReviewResult && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                  <p className="text-sm font-medium text-green-800">✓ {testReviewResult.message}</p>
                  <p className="text-xs text-green-700">Status: {testReviewResult.status}</p>
                  <p className="text-xs text-green-700">Auto-publish: {testReviewResult.auto_publish_triggered ? 'Yes' : 'No (held for approval)'}</p>
                  <div className="mt-2 rounded-lg bg-white border border-green-200 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-600 mb-1">AI Reply Preview</p>
                    <p className="text-sm text-gray-700">{testReviewResult.reply_preview}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-gray-400">Review will be flagged as test</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setTestReviewUser(null)} className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 sm:flex-none">Close</button>
                <button onClick={handleSubmitTestReview} disabled={submittingTestReview || !testReviewName.trim()} className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 sm:flex-none">
                  {submittingTestReview ? <><Loader2 size={14} className="animate-spin" />Processing...</> : <><FlaskConical size={14} />Inject Test Review</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">{icon}<span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span></div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-1 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mb-2 text-xs text-gray-500">{description}</p>
      {children}
    </div>
  )
}

function PreviewCard({ title, review, reply, stars }: { title: string; review: string; reply: string; stars: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm">{'⭐'.repeat(stars)}</span>
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
      <p className="mb-3 text-sm italic text-gray-500">&ldquo;{review}&rdquo;</p>
      <div className="rounded-lg bg-white border border-gray-200 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-600 mb-1">AI Reply</p>
        <p className="text-sm text-gray-700">{reply}</p>
      </div>
    </div>
  )
}