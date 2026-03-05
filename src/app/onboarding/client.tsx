'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronRight, Plus, MapPin, Trash2 } from 'lucide-react'
import { AppLogo } from '@/components/app-logo'
import { toast } from 'sonner'

interface OnboardingLocation {
  id: string
  location_name: string
  location_address: string
  google_connected: boolean
}

export default function OnboardingClient() {
  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [businessLocation, setBusinessLocation] = useState('')
  const [locations, setLocations] = useState<OnboardingLocation[]>([])
  const [saving, setSaving] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('google') === 'connected') {
      setStep(2)
      toast.success('Google Business Profile connected!')
      // Refresh locations
      fetchLocations()
    }
    if (searchParams.get('error')) {
      toast.error('Failed to connect Google. Please try again.')
    }
  }, [searchParams])

  const fetchLocations = async () => {
    const res = await fetch('/api/locations')
    if (res.ok) {
      const data = await res.json()
      setLocations(
        (data.locations || []).map((l: Record<string, unknown>) => ({
          id: l.id,
          location_name: l.location_name || '',
          location_address: l.location_address || '',
          google_connected: !!(l.google_account_id && l.google_location_id),
        }))
      )
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [])

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
      // Create a default location if none exist
      if (locations.length === 0) {
        await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location_name: businessName,
            location_address: businessLocation,
            is_primary: true,
          }),
        })
        await fetchLocations()
      }
      setStep(2)
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

  const handleAddLocation = async () => {
    if (locations.length >= 3) {
      toast.error('Maximum of 3 locations per account')
      return
    }
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_name: 'New Location' }),
      })
      if (res.ok) {
        await fetchLocations()
        toast.success('Location added')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to add')
      }
    } catch {
      toast.error('Failed to add location')
    }
  }

  const handleRemoveLocation = async (id: string) => {
    try {
      await fetch(`/api/locations?id=${id}`, { method: 'DELETE' })
      await fetchLocations()
    } catch {
      toast.error('Failed to remove')
    }
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await saveSettings({ onboarding_completed: true })
      router.push('/dashboard')
    } catch {
      toast.error('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <AppLogo size="large" />
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${s < step ? 'bg-green-500 text-white' : s === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {s < step ? <Check size={16} /> : s}
              </div>
              {s < 2 && <div className={`h-0.5 w-8 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-gray-900">Your Business</h2>
              <p className="mb-6 text-sm text-gray-500">Tell us about your business so we can personalize replies.</p>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Business Name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Turbo Wash" />
              </div>

              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Location</label>
                <input type="text" value={businessLocation} onChange={(e) => setBusinessLocation(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. 123 Main St, Sydney NSW" />
              </div>

              <button onClick={handleStep1} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Continue'}
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Step 2: Connect Locations */}
          {step === 2 && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-gray-900">Connect Your Locations</h2>
              <p className="mb-6 text-sm text-gray-500">Link up to 3 Google Business Profile locations. You can always add more later from Settings.</p>

              {/* Connected locations */}
              {locations.length > 0 && (
                <div className="mb-4 space-y-2">
                  {locations.map((loc) => (
                    <div key={loc.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-500" />
                        <span className="text-sm font-medium text-gray-900">{loc.location_name || 'Unnamed'}</span>
                        {loc.location_address && <span className="text-xs text-gray-400">· {loc.location_address}</span>}
                      </div>
                      <button onClick={() => handleRemoveLocation(loc.id)} className="rounded p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add another location */}
              {locations.length < 3 && (
                <button onClick={handleAddLocation} className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700">
                  <Plus size={16} />
                  Add Another Location ({locations.length}/3)
                </button>
              )}

              {/* Connect Google */}
              <button onClick={handleConnectGoogle} className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Connect Google Business Profile
              </button>

              <button onClick={handleFinish} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Finishing setup...' : locations.length > 0 ? 'Go to Dashboard' : 'Skip for now'}
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Your 14-day free trial has started. You&apos;ll have full access to all features.
        </p>
      </div>
    </div>
  )
}
