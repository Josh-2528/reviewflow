import { Suspense } from 'react'
import OnboardingClient from './client'

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <OnboardingClient />
    </Suspense>
  )
}
