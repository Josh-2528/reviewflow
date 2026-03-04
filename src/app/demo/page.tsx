'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AppLogo } from '@/components/app-logo'

export default function DemoPage() {
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    const loginDemo = async () => {
      try {
        const res = await fetch('/api/demo/login', { method: 'POST' })
        const data = await res.json()

        if (res.ok) {
          router.push('/dashboard')
        } else {
          setStatus('error')
          setErrorMsg(data.error || 'Failed to start demo')
        }
      } catch {
        setStatus('error')
        setErrorMsg('Something went wrong. Please try again.')
      }
    }

    loginDemo()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mb-6 inline-flex items-center gap-2">
          <AppLogo size="large" />
        </div>

        {status === 'loading' && (
          <div>
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">
              Setting up your demo dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="mx-auto mb-4 rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
            <button
              onClick={() => {
                setStatus('loading')
                window.location.reload()
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
