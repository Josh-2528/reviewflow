'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AppLogo } from '@/components/app-logo'
import { CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    router.push('/onboarding')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <AppLogo size="large" />
          </Link>
          <h1 className="mt-4 text-xl font-bold text-gray-900">Start Your 14-Day Free Trial</h1>
          <p className="mt-1 text-sm text-gray-600">No credit card required. Full access to everything.</p>
        </div>

        <form
          onSubmit={handleSignup}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="you@business.com"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Start Free Trial'}
          </button>
        </form>

        {/* Trial features */}
        <div className="mt-6 space-y-2">
          {[
            'Unlimited reviews & AI replies',
            'Auto-polling every 15 min',
            'Auto-publish to Google',
            'Full dashboard access',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              {f}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
