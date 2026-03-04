'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronRight } from 'lucide-react'
import { AppLogo } from '@/components/app-logo'
import { toast } from 'sonner'

const toneOptions = [
  { value: 'friendly and professional', label: 'Friendly & Professional' },
  { value: 'casual and warm', label: 'Casual & Warm' },
  { value: 'formal and corporate', label: 'Formal & Corporate' },
  { value: 'short and direct', label: 'Short & Direct' },
]

export default function OnboardingClient() {
  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [businessLocation, setBusinessLocation] = useState('')
  const [tonePreference, setTonePreference] = useState('friendly and professional')
  const [customInstructions, setCustomInstructions] = useState('')
  const [autoPublish, setAutoPublish] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [saving, setSaving] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('google') === 'connected') {
      setGoogleConnected(true)
      setStep(4)
      toast.success('Google Business Profile connected!')
    }
    if (searchParams.get('error')) {
      toast.error('Failed to connect Google. Please try again.')
    }
  }, [searchParams])

  const saveSettings = async (updates: Record<string, unknown>) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to save')
  }

  const handleStep1 = async () => {
    if (!businessName.trim() || !businessLocation.trim()) {
      toast.error('Please fill in both fields')
      return
    }
    setSaving(true)
    try {
      await saveSettings({
        business_name: businessName,
        business_location: businessLocation,
      })
      setStep(2)
    } catch {
      toast.error('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  const handleStep2 = async () => {
    setSaving(true)
    try {
      await saveSettings({
        tone_preference: tonePreference,
        custom_instructions: customInstructions || null,
      })
      setStep(3)
    } catch {
      toast.error('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  const handleConnectGoogle = async () => {
    try {
      const res = await fetch('/api/auth/google', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Failed to start Google connection')
      }
    } catch {
      toast.error('Failed to connect to Google')
    }
  }

  const handleStep4 = async () => {
    setSaving(true)
    try {
      await saveSettings({
        auto_publish: autoPublish,
        onboarding_completed: true,
      })
      router.push('/dashboard')
    } catch {
      toast.error('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <AppLogo size="large" />
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  s < step
                    ? 'bg-green-500 text-white'
                    : s === step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? <Check size={16} /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`h-0.5 w-8 ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-gray-900">
                Your Business
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                Tell us about your business so we can personalize replies.
              </p>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Joe's Coffee House"
                />
              </div>

              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  value={businessLocation}
                  onChange={(e) => setBusinessLocation(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Melbourne, Australia"
                />
              </div>

              <button
                onClick={handleStep1}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Continue'}
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Step 2: Tone */}
          {step === 2 && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-gray-900">
                Reply Tone
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                Choose how your replies should sound.
              </p>

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

              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Custom Instructions (optional)
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder='e.g. "Always mention our loyalty program" or "Invite unhappy customers to call us on 0400 123 456"'
                />
              </div>

              <button
                onClick={handleStep2}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Continue'}
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Step 3: Connect Google */}
          {step === 3 && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-gray-900">
                Connect Google Business Profile
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                Link your Google Business Profile so we can monitor your reviews and
                post replies.
              </p>

              {googleConnected ? (
                <div className="mb-6 rounded-lg bg-green-50 p-4 text-center">
                  <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  <p className="font-medium text-green-700">
                    Google Business Profile Connected!
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleConnectGoogle}
                  className="mb-6 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Connect Google Business Profile
                </button>
              )}

              <button
                onClick={() => setStep(4)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                {googleConnected ? 'Continue' : 'Skip for now'}
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Step 4: Auto-publish */}
          {step === 4 && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-gray-900">
                Auto-Publish Replies
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                Should we publish AI replies automatically, or do you prefer to review
                each one first?
              </p>

              <div className="mb-6 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Auto-publish replies</p>
                    <p className="mt-1 text-sm text-gray-500">
                      When enabled, AI replies are posted to Google automatically
                      without waiting for your approval.
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
              </div>

              <button
                onClick={handleStep4}
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Finishing setup...' : 'Go to Dashboard'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
