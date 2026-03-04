'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, ArrowLeft } from 'lucide-react'

export function ImpersonationBanner() {
  const searchParams = useSearchParams()
  const impersonateId = searchParams.get('impersonate')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!impersonateId) return

    // Fetch the impersonated user's profile
    fetch(`/api/settings?impersonate=${impersonateId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profile?.email) {
          setEmail(data.profile.email)
        }
      })
      .catch(() => {})
  }, [impersonateId])

  if (!impersonateId) return null

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md">
      <div className="flex items-center gap-2">
        <Eye size={16} />
        <span>
          Viewing as{' '}
          <strong>{email || impersonateId}</strong>
        </span>
      </div>
      <Link
        href="/admin"
        className="flex items-center gap-1.5 rounded-md bg-white/20 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-white/30"
      >
        <ArrowLeft size={14} />
        Back to Admin
      </Link>
    </div>
  )
}
