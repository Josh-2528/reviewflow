'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Suspense } from 'react'
import { ImpersonationBanner } from '@/components/impersonation-banner'
import { AppLogo } from '@/components/app-logo'
import {
  MessageSquareText,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  Save,
  Unplug,
  Link2,
  CreditCard,
  ExternalLink,
  Mail,
  AlertTriangle,
  MapPin,
  Plus,
  Trash2,
  Phone,
  AtSign,
} from 'lucide-react'
import type { User, Location } from '@/lib/types'

type PlanStatus = 'trial' | 'pro' | 'expired'

const toneOptions = [
  { value: 'friendly and professional', label: 'Friendly & Professional' },
  { value: 'casual and warm', label: 'Casual & Warm' },
  { value: 'formal and corporate', label: 'Formal & Corporate' },
  { value: 'short and direct', label: 'Short & Direct' },
]

export default function SettingsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <SettingsPage />
    </Suspense>
  )
}

function SettingsPage() {
  const [profile, setProfile] = useState<User | null>(null)
  const [planStatus, setPlanStatus] = useState<PlanStatus>('trial')
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(14)
  const [businessName, setBusinessName] = useState('')
  const [businessLocation, setBusinessLocation] = useState('')
  const [tonePreference, setTonePreference] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [autoPublishStars, setAutoPublishStars] = useState<number[]>([4, 5])
  const [emailNewReview, setEmailNewReview] = useState(true)
  const [emailWeeklySummary, setEmailWeeklySummary] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState<Location[]>([])
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactRefStyle, setContactRefStyle] = useState('email us at')
  const [contactIncludeOn, setContactIncludeOn] = useState('negative_only')
  const [signOff, setSignOff] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const impersonateId = searchParams.get('impersonate')
  const qsFirst = impersonateId ? `?impersonate=${impersonateId}` : ''

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetch(`/api/settings${qsFirst}`)
      if (res.ok) {
        const data = await res.json()
        const p = data.profile
        setProfile(p)
        setPlanStatus(data.planStatus || 'trial')
        setTrialDaysRemaining(data.trialDaysRemaining ?? 14)
        setBusinessName(p.business_name || '')
        setBusinessLocation(p.business_location || '')
        setTonePreference(p.tone_preference || 'friendly and professional')
        setCustomInstructions(p.custom_instructions || '')
        setAutoPublishStars(Array.isArray(p.auto_publish_stars) ? p.auto_publish_stars : [4, 5])
        setEmailNewReview(p.email_new_review !== false)
        setEmailWeeklySummary(p.email_weekly_summary !== false)
        if (data.locations) setLocations(data.locations)
        // Load AI prompt settings (contact details / sign-off)
        if (data.aiSettings) {
          setContactEmail(data.aiSettings.contact_email || '')
          setContactPhone(data.aiSettings.contact_phone || '')
          setContactRefStyle(data.aiSettings.contact_reference_style || 'email us at')
          setContactIncludeOn(data.aiSettings.contact_include_on || 'negative_only')
          setSignOff(data.aiSettings.sign_off || '')
        }
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          business_location: businessLocation,
          tone_preference: tonePreference,
          custom_instructions: customInstructions || null,
          auto_publish_stars: autoPublishStars,
          email_new_review: emailNewReview,
          email_weekly_summary: emailWeeklySummary,
        }),
      })
      // Also save contact details to ai_prompt_settings
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_contact_email: contactEmail || null,
          ai_contact_phone: contactPhone || null,
          ai_contact_reference_style: contactRefStyle,
          ai_contact_include_on: contactIncludeOn,
          ai_sign_off: signOff || null,
        }),
      })
      if (res.ok) {
        toast.success('Settings saved!')
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    }
    setSaving(false)
  }

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to open billing portal')
      }
    } catch {
      toast.error('Failed to open billing portal')
    }
  }

  const handleConnectGoogle = async () => {
    try {
      const res = await fetch('/api/auth/google', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error('Failed to start Google connection')
    }
  }

  const handleDisconnectGoogle = async () => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_connected: false,
          google_access_token: null,
          google_refresh_token: null,
          google_account_id: null,
          google_location_id: null,
        }),
      })
      toast.success('Google disconnected')
      setProfile((prev) => (prev ? { ...prev, google_connected: false } : null))
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  const handleUpdateLocation = async (locId: string, field: string, value: string) => {
    try {
      await fetch('/api/locations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: locId, [field]: value }),
      })
      setLocations((prev) =>
        prev.map((l) => (l.id === locId ? { ...l, [field]: value } : l))
      )
    } catch {
      toast.error('Failed to update location')
    }
  }

  const handleRemoveLocation = async (locId: string) => {
    try {
      const res = await fetch(`/api/locations?id=${locId}`, { method: 'DELETE' })
      if (res.ok) {
        setLocations((prev) => prev.filter((l) => l.id !== locId))
        toast.success('Location removed')
      } else {
        toast.error('Failed to remove location')
      }
    } catch {
      toast.error('Failed to remove location')
    }
  }

  const handleAddLocation = async () => {
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_name: 'New Location' }),
      })
      if (res.ok) {
        const data = await res.json()
        setLocations((prev) => [...prev, data.location])
        toast.success('Location added')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to add location')
      }
    } catch {
      toast.error('Failed to add location')
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSubscribe = async () => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to start checkout')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  const planLabel =
    planStatus === 'pro'
      ? 'ReviewFlow Pro'
      : planStatus === 'trial'
      ? `Free Trial (${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining)`
      : 'Trial Expired'

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
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
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
              className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
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
            <Link href="/dashboard" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
              <BarChart3 size={20} />
            </Link>
            <Link href="/activity" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
              <Activity size={20} />
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
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <h1 className="mb-8 text-2xl font-bold text-gray-900">Settings</h1>

          {/* Business Settings */}
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Business</h2>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={businessLocation}
                onChange={(e) => setBusinessLocation(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </section>

          {/* Reply Settings */}
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Reply Settings</h2>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Tone Preference
              </label>
              <select
                value={tonePreference}
                onChange={(e) => setTonePreference(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {toneOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Custom Instructions
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder='e.g. "Always mention our loyalty program"'
              />
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3">
                <p className="font-medium text-gray-900">Auto-publish replies for reviews rated:</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  Checked ratings will be replied to and published automatically. Unchecked ratings will generate an AI draft for your approval before publishing.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4, 5].map((star) => {
                  const checked = autoPublishStars.includes(star)
                  return (
                    <label
                      key={star}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        checked
                          ? 'border-blue-300 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setAutoPublishStars(autoPublishStars.filter((s) => s !== star))
                          } else {
                            setAutoPublishStars([...autoPublishStars, star].sort())
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {'★'.repeat(star)} {star}-star
                    </label>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Google Connection */}
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Google Business Profile
            </h2>

            {profile?.google_connected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-700">Connected</span>
                </div>
                <button
                  onClick={handleDisconnectGoogle}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Unplug size={14} />
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-300" />
                  <span className="text-sm text-gray-500">Not connected</span>
                </div>
                <button
                  onClick={handleConnectGoogle}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Link2 size={14} />
                  Connect
                </button>
              </div>
            )}
          </section>

          {/* Locations */}
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
              </div>
              {locations.length < 3 && (
                <button onClick={handleAddLocation} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                  <Plus size={14} /> Add Location
                </button>
              )}
            </div>
            <p className="mb-4 text-sm text-gray-500">Manage up to 3 Google Business Profile locations. Each location can have its own contact person for notifications.</p>

            {locations.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">No locations added yet. Add your first location above.</p>
            ) : (
              <div className="space-y-4">
                {locations.map((loc) => (
                  <div key={loc.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-500" />
                        <span className="text-sm font-medium text-gray-900">{loc.location_name || 'Unnamed Location'}</span>
                        {loc.is_primary && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Primary</span>}
                      </div>
                      <button onClick={() => handleRemoveLocation(loc.id)} className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">Location Name</label>
                        <input type="text" defaultValue={loc.location_name || ''} onBlur={(e) => handleUpdateLocation(loc.id, 'location_name', e.target.value)} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">Address</label>
                        <input type="text" defaultValue={loc.location_address || ''} onBlur={(e) => handleUpdateLocation(loc.id, 'location_address', e.target.value)} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">Contact Name</label>
                        <input type="text" defaultValue={loc.contact_name || ''} onBlur={(e) => handleUpdateLocation(loc.id, 'contact_name', e.target.value)} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Site manager" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">Contact Email</label>
                        <input type="email" defaultValue={loc.contact_email || ''} onBlur={(e) => handleUpdateLocation(loc.id, 'contact_email', e.target.value)} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="manager@business.com" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">Contact Phone</label>
                        <input type="text" defaultValue={loc.contact_phone || ''} onBlur={(e) => handleUpdateLocation(loc.id, 'contact_phone', e.target.value)} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Optional" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Contact Details & Sign-off for AI Replies */}
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AtSign className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Contact Details for Replies</h2>
            </div>
            <p className="mb-4 text-sm text-gray-500">These details are included in AI-generated replies so customers know how to reach you.</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Contact Email</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="hello@yourbusiness.com" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Contact Phone <span className="text-gray-400">(optional)</span></label>
                <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0400 123 456" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">How to reference contact</label>
                <select value={contactRefStyle} onChange={(e) => setContactRefStyle(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="email us at">email us at</option>
                  <option value="call us on">call us on</option>
                  <option value="reach out to us at">reach out to us at</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Include contact on</label>
                <select value={contactIncludeOn} onChange={(e) => setContactIncludeOn(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="negative_only">Only on negative reviews (1-3 stars)</option>
                  <option value="always">On all reviews</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Sign-off</label>
              <input type="text" value={signOff} onChange={(e) => setSignOff(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder='e.g. "The team at Camden Car Wash"' />
              <p className="mt-1 text-xs text-gray-400">Added to the end of every AI reply. Leave blank for no sign-off.</p>
            </div>
          </section>

          {/* Subscription & Billing */}
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Subscription & Billing
            </h2>

            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Plan</p>
                <p className="text-lg font-semibold text-gray-900">{planLabel}</p>
              </div>
              {planStatus === 'pro' && profile?.subscription_status && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    profile.subscription_status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : profile.subscription_status === 'past_due'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {profile.subscription_status}
                </span>
              )}
              {planStatus === 'expired' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  <AlertTriangle size={12} />
                  Expired
                </span>
              )}
            </div>

            {profile?.subscription_current_period_end && planStatus === 'pro' && (
              <p className="mb-4 text-sm text-gray-500">
                Current period ends:{' '}
                {new Date(profile.subscription_current_period_end).toLocaleDateString()}
              </p>
            )}

            <div className="flex gap-3">
              {planStatus !== 'pro' && (
                <button
                  onClick={handleSubscribe}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <CreditCard size={14} />
                  Subscribe Now — $88/mo
                </button>
              )}
              {profile?.stripe_customer_id && (
                <button
                  onClick={handleManageBilling}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ExternalLink size={14} />
                  Manage Subscription
                </button>
              )}
            </div>
          </section>

          {/* Email Notifications */}
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div>
                  <p className="font-medium text-gray-900">New review alerts</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Get an email whenever a new review is posted
                  </p>
                </div>
                <button
                  onClick={() => setEmailNewReview(!emailNewReview)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    emailNewReview ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      emailNewReview ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div>
                  <p className="font-medium text-gray-900">Weekly summary</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Receive a summary every Monday with your weekly stats
                  </p>
                </div>
                <button
                  onClick={() => setEmailWeeklySummary(!emailWeeklySummary)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    emailWeeklySummary ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      emailWeeklySummary ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Account */}
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Account</h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="text-sm text-gray-900">{profile?.email}</p>
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </main>
    </div>
  )
}
