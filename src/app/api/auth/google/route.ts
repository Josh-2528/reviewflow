import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleAuthUrl } from '@/lib/google'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Support returnTo for redirecting back to settings vs onboarding
    let returnTo = 'onboarding'
    try {
      const body = await request.json()
      if (body.returnTo === 'settings') returnTo = 'settings'
    } catch {
      // No body or invalid JSON — default to onboarding
    }

    const state = `${user.id}:${returnTo}`
    const authUrl = getGoogleAuthUrl(state)

    return NextResponse.json({ url: authUrl })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Google auth' },
      { status: 500 }
    )
  }
}
