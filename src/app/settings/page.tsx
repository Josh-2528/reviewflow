'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  MessageSquareText,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  Save,
  Unplug,
  Link2,
} from 'lucide-react'
import type { User } from '@/lib/types'

const toneOptions = [
  { value: 'friendly and professional', label: 'Friendly & Professional' },
  { value: 'casual and warm', label: 'Casual & Warm' },
  { value: 'formal and corporate', label: 'Formal & Corporate' },
  { value: 'short and direct', label: 'Short & Direct' },
]

export default function SettingsPage() {
  const [profile, setProfile] = useState<User | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [businessLocation, setBusinessLocation] = useState('')
  const [tonePreference, setTonePreference] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [autoPublish, setAutoPublish] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const p = data.profile
        setProfile(p)
        setBusinessName(p.business_name || '')
        setBusinessLocation(p.business_location || '')
        setTonePreference(p.tone_preference || 'friendly and professional')
        setCustomInstructions(p.custom_instructions || '')
        setAutoPublish(p.auto_publish || false)
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
          auto_publish: autoPublish,
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

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
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
            <MessageSquareText className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-gray-900">ReviewFlow</span>
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

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <p className="font-medium text-gray-900">Auto-publish replies</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  Post AI replies automatically without approval
                </p>
              </div>
              <button
                onClick={() => setAutoPublish(!autoPublish)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  autoPublish ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    autoPublish ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
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
